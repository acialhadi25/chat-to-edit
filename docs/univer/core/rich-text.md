# Rich Text - Univer Sheet

## Overview

Univer menyediakan fitur rich text yang powerful yang dapat digunakan dalam berbagai skenario, termasuk konten cell, comments, dan hyperlinks. Rich text memungkinkan formatting teks yang kompleks dengan berbagai style dan decorations.

## Core Components

Rich text system terdiri dari dua komponen utama:

1. **TextStyle**: Mengontrol appearance teks (font, size, color, dll)
2. **ParagraphStyle**: Mengontrol formatting level paragraph (alignment, indentation, line spacing, dll)

## Creating Rich Text Objects

### Basic Creation

```typescript
// Create rich text
const richText = univerAPI.newRichText()
const richTextValue = univerAPI.newRichTextValue({ 
  body: { dataStream: 'Hello Univer\r\n' } 
})

// Create paragraph style
const paragraphStyle = univerAPI.newParagraphStyle()
const paragraphStyleValue = univerAPI.newParagraphStyleValue()

// Create text style
const textStyle = univerAPI.newTextStyle()
const textStyleValue = univerAPI.newTextStyleValue()

// Create text decoration
const decoration = univerAPI.newTextDecoration()
```

### Builder vs Value Versions

- **Builder versions** (e.g., `newRichText`): Untuk creating dan modifying styles
- **Value versions** (e.g., `newRichTextValue`): Untuk creating read-only style objects

## Text Styles

### Basic Text Styling

```typescript
// Create basic text style
const textStyle = univerAPI.newTextStyle()
  .setFontFamily('Arial')
  .setFontSize(12)
  .setItalic(true)
  .setBold(true)
  .build()

// Create text style with colors
const coloredStyle = univerAPI.newTextStyle()
  .setColor({ rgb: '#FF0000' })      // Red text
  .setBackground({ rgb: '#FFFF00' }) // Yellow background
  .build()
```

### Text Decorations

```typescript
// Add underline
const underlineStyle = univerAPI.newTextStyle()
  .setUnderline(
    univerAPI.newTextDecoration()
      .setShow(true)
      .setColor({ rgb: '#0000FF' })
      .setLineType(univerAPI.Enum.TextDecoration.SINGLE)
  )
  .build()

// Add strikethrough
const strikethroughStyle = univerAPI.newTextStyle()
  .setStrikethrough(
    univerAPI.newTextDecoration()
      .setShow(true)
  )
  .build()
```

### Available Text Decoration Types

```typescript
univerAPI.Enum.TextDecoration.SINGLE    // Single line
univerAPI.Enum.TextDecoration.DOUBLE    // Double line
univerAPI.Enum.TextDecoration.DOTTED    // Dotted line
univerAPI.Enum.TextDecoration.DASHED    // Dashed line
univerAPI.Enum.TextDecoration.WAVY      // Wavy line
```

## Paragraph Styles

### Basic Paragraph Styling

```typescript
// Create basic paragraph style
const paragraphStyle = univerAPI.newParagraphStyle()
  .setHorizontalAlign(univerAPI.Enum.HorizontalAlign.CENTER)
  .setLineSpacing(1.5)
  .build()

// Set paragraph indentation
const indentedStyle = univerAPI.newParagraphStyle()
  .setIndentFirstLine({ value: 2, unit: 'cm' })
  .setIndentStart({ value: 1, unit: 'cm' })
  .build()
```

### Alignment Options

```typescript
univerAPI.Enum.HorizontalAlign.LEFT
univerAPI.Enum.HorizontalAlign.CENTER
univerAPI.Enum.HorizontalAlign.RIGHT
univerAPI.Enum.HorizontalAlign.JUSTIFY

univerAPI.Enum.VerticalAlign.TOP
univerAPI.Enum.VerticalAlign.MIDDLE
univerAPI.Enum.VerticalAlign.BOTTOM
```

## Usage in Cells

### Method 1: setRichTextValueForCell

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1')

// Create and set rich text
const richText = univerAPI.newRichText()
  .insertText('Hello World')
  .setStyle(0, 5, { bl: 1, cl: { rgb: '#c81e1e' } })  // "Hello" bold red
  .setStyle(6, 11, { bl: 1, cl: { rgb: '#0000FF' } }) // "World" bold blue

fRange.setRichTextValueForCell(richText)

// Get plain text
console.log(fRange.getValue(true).toPlainText()) // "Hello World"
```

### Method 2: setRichTextValues

```typescript
const fRange = fWorksheet.getRange('A1:B2')

// Set multiple cells with rich text
fRange.setRichTextValues([
  [richText1, richText2],
  [richText3, null],
])
```

## Complete Examples

### Example 1: Formatted Cell Content

```typescript
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1')

// Create rich text with multiple styles
const richText = univerAPI.newRichText()
  .insertText('Important: ')
  .setStyle(0, 10, {
    bl: 1,                        // Bold
    cl: { rgb: '#FF0000' },       // Red color
    fs: 14,                       // Font size 14
  })
  .insertText('Please review this data carefully.')
  .setStyle(11, 45, {
    it: 1,                        // Italic
    cl: { rgb: '#000000' },       // Black color
  })

fRange.setRichTextValueForCell(richText)
```

### Example 2: Multi-Style Text

```typescript
const richText = univerAPI.newRichText()
  .insertText('Product: ')
  .setStyle(0, 9, { bl: 1 })
  .insertText('iPhone 15 Pro')
  .setStyle(9, 22, { 
    cl: { rgb: '#0066CC' },
    fs: 12,
  })
  .insertText('\nPrice: ')
  .setStyle(23, 30, { bl: 1 })
  .insertText('$999')
  .setStyle(30, 34, {
    cl: { rgb: '#00AA00' },
    fs: 14,
    bl: 1,
  })

fRange.setRichTextValueForCell(richText)
```

### Example 3: Hyperlink with Rich Text

```typescript
const richText = univerAPI.newRichText()
  .insertText('Visit our ')
  .insertLink('website', 'https://univer.ai/')
  .insertText(' for more information.')

fRange.setRichTextValueForCell(richText)
```

### Example 4: Comments with Rich Text

```typescript
const range = univerAPI.getActiveWorkbook()
  .getActiveSheet()
  .getActiveRange()

// Create formatted comment
const comment = univerAPI.newTheadComment()
  .setContent(
    univerAPI.newRichText()
      .insertText('Note: ')
      .setStyle(0, 5, { bl: 1, cl: { rgb: '#FF0000' } })
      .insertText('Please check the data in this cell')
  )

// Add comment asynchronously
const success = await range.addCommentAsync(comment)
if (success) {
  console.log('Comment added successfully')
}
```

### Example 5: Table Headers with Rich Text

```typescript
const headers = ['Name', 'Age', 'Department', 'Salary']
const headerRange = fWorksheet.getRange('A1:D1')

headers.forEach((header, index) => {
  const cell = fWorksheet.getRange(0, index)
  const richText = univerAPI.newRichText()
    .insertText(header)
    .setStyle(0, header.length, {
      bl: 1,                          // Bold
      cl: { rgb: '#FFFFFF' },         // White text
      bg: { rgb: '#4472C4' },         // Blue background
      fs: 12,                         // Font size 12
    })
  
  cell.setRichTextValueForCell(richText)
})
```

### Example 6: Custom Hook

```typescript
import { useCallback } from 'react'

export const useUniverRichText = (univerAPI: FUniver | null) => {
  const createRichText = useCallback(
    (text: string, styles: Array<{
      start: number
      end: number
      style: any
    }>) => {
      if (!univerAPI) return null

      const richText = univerAPI.newRichText().insertText(text)

      styles.forEach(({ start, end, style }) => {
        richText.setStyle(start, end, style)
      })

      return richText
    },
    [univerAPI]
  )

  const setFormattedCell = useCallback(
    (cell: string, text: string, styles: any[]) => {
      if (!univerAPI) return

      const workbook = univerAPI.getActiveWorkbook()
      const worksheet = workbook.getActiveSheet()
      const range = worksheet.getRange(cell)

      const richText = createRichText(text, styles)
      if (richText) {
        range.setRichTextValueForCell(richText)
      }
    },
    [univerAPI, createRichText]
  )

  return { createRichText, setFormattedCell }
}

// Usage
const { setFormattedCell } = useUniverRichText(univerAPI)

setFormattedCell('A1', 'Hello World', [
  { start: 0, end: 5, style: { bl: 1, cl: { rgb: '#FF0000' } } },
  { start: 6, end: 11, style: { it: 1, cl: { rgb: '#0000FF' } } },
])
```

## Style Properties Reference

### Text Style Properties

```typescript
interface TextStyle {
  bl?: 0 | 1                    // Bold (0: false, 1: true)
  it?: 0 | 1                    // Italic
  ul?: TextDecoration           // Underline
  st?: TextDecoration           // Strikethrough
  ol?: TextDecoration           // Overline
  fs?: number                   // Font size
  ff?: string                   // Font family
  cl?: { rgb: string }          // Text color
  bg?: { rgb: string }          // Background color
  va?: VerticalAlign            // Vertical align
}
```

### Paragraph Style Properties

```typescript
interface ParagraphStyle {
  horizontalAlign?: HorizontalAlign
  lineSpacing?: number
  indentFirstLine?: { value: number, unit: string }
  indentStart?: { value: number, unit: string }
  indentEnd?: { value: number, unit: string }
  spacingBefore?: { value: number, unit: string }
  spacingAfter?: { value: number, unit: string }
}
```

## Best Practices

### 1. Use Style Ranges Carefully

```typescript
// ✅ Good: Clear style ranges
const richText = univerAPI.newRichText()
  .insertText('Hello World')
  .setStyle(0, 5, { bl: 1 })    // "Hello"
  .setStyle(6, 11, { it: 1 })   // "World"

// ❌ Bad: Overlapping ranges
richText.setStyle(0, 10, { bl: 1 })
richText.setStyle(5, 11, { it: 1 }) // Overlaps with previous
```

### 2. Reuse Rich Text Objects

```typescript
// ✅ Good: Create once, reuse
const headerStyle = univerAPI.newRichText()
  .insertText('Header')
  .setStyle(0, 6, { bl: 1, fs: 14 })

// Use in multiple cells
cells.forEach(cell => {
  cell.setRichTextValueForCell(headerStyle)
})
```

### 3. Handle Plain Text Conversion

```typescript
// ✅ Good: Get plain text when needed
const richText = fRange.getValue(true)
const plainText = richText.toPlainText()
console.log(plainText)
```

### 4. Validate Style Indices

```typescript
// ✅ Good: Validate indices
const text = 'Hello World'
const richText = univerAPI.newRichText().insertText(text)

const start = 0
const end = Math.min(5, text.length)

if (start >= 0 && end <= text.length && start < end) {
  richText.setStyle(start, end, { bl: 1 })
}
```

## Common Use Cases

### 1. Highlight Keywords

```typescript
const highlightKeywords = (text: string, keywords: string[]) => {
  const richText = univerAPI.newRichText().insertText(text)

  keywords.forEach(keyword => {
    let index = text.indexOf(keyword)
    while (index !== -1) {
      richText.setStyle(index, index + keyword.length, {
        bg: { rgb: '#FFFF00' },
        bl: 1,
      })
      index = text.indexOf(keyword, index + 1)
    }
  })

  return richText
}
```

### 2. Format Currency

```typescript
const formatCurrency = (amount: number) => {
  const text = `$${amount.toFixed(2)}`
  const richText = univerAPI.newRichText()
    .insertText(text)
    .setStyle(0, text.length, {
      cl: amount >= 0 ? { rgb: '#00AA00' } : { rgb: '#FF0000' },
      bl: 1,
      fs: 12,
    })

  return richText
}
```

### 3. Create Labels

```typescript
const createLabel = (label: string, value: string) => {
  const richText = univerAPI.newRichText()
    .insertText(`${label}: `)
    .setStyle(0, label.length + 2, { bl: 1 })
    .insertText(value)

  return richText
}
```

## Troubleshooting

### Issue 1: Styles Not Applied
**Problem**: Style tidak muncul di cell

**Solution**: Pastikan menggunakan setRichTextValueForCell
```typescript
// ✅ Correct
fRange.setRichTextValueForCell(richText)

// ❌ Wrong
fRange.setValue(richText)
```

### Issue 2: Wrong Style Range
**Problem**: Style diterapkan ke karakter yang salah

**Solution**: Check index (0-based)
```typescript
const text = 'Hello World'
// H=0, e=1, l=2, l=3, o=4, space=5, W=6, o=7, r=8, l=9, d=10

// Style "Hello" (0-4)
richText.setStyle(0, 5, { bl: 1 })

// Style "World" (6-10)
richText.setStyle(6, 11, { bl: 1 })
```

### Issue 3: Cannot Get Plain Text
**Problem**: Tidak bisa mendapatkan plain text

**Solution**: Use getValue(true) dan toPlainText()
```typescript
const cellValue = fRange.getValue(true)
const plainText = cellValue.toPlainText()
```

## API Reference

### univerAPI Methods
- `newRichText()`: Create rich text builder
- `newRichTextValue(data)`: Create rich text value
- `newTextStyle()`: Create text style builder
- `newTextStyleValue()`: Create text style value
- `newParagraphStyle()`: Create paragraph style builder
- `newParagraphStyleValue()`: Create paragraph style value
- `newTextDecoration()`: Create text decoration

### FRichText Methods
- `insertText(text)`: Insert text
- `setStyle(start, end, style)`: Set style for range
- `insertLink(text, url)`: Insert hyperlink
- `toPlainText()`: Get plain text
- `copy()`: Copy rich text

### FRange Methods
- `setRichTextValueForCell(richText)`: Set rich text to cell
- `setRichTextValues(values)`: Set rich text to multiple cells
- `getValue(true)`: Get rich text value

## Referensi

- [Facade API Reference](https://reference.univer.ai/)
- [Official Documentation](https://docs.univer.ai/guides/sheets/features/core/rich-text)
- [Hyperlink Guide](../features/hyperlink.md)
