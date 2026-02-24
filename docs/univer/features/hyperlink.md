# Hyperlink - Univer Sheet

## Overview

Hyperlinks digunakan untuk navigasi cepat dan akses konten dalam spreadsheet, seperti worksheet internal, cells, dan halaman web eksternal atau alamat email.

## Installation

### Preset Mode
```bash
npm install @univerjs/preset-sheets-hyper-link
```

```typescript
import { UniverSheetsHyperLinkPreset } from '@univerjs/preset-sheets-hyper-link'
import UniverPresetSheetsHyperLinkEnUS from '@univerjs/preset-sheets-hyper-link/locales/en-US'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsHyperLinkEnUS,
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsHyperLinkPreset({
      // Customize external link handling
      urlHandler: {
        navigateToOtherWebsite: url => window.open(`${url}?utm_source=univer`, '_blank'),
      },
    }),
  ],
})
```

### Plugin Mode
```bash
npm install @univerjs/sheets-hyper-link @univerjs/sheets-hyper-link-ui
```

```typescript
import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link'
import { UniverSheetsHyperLinkUIPlugin } from '@univerjs/sheets-hyper-link-ui'
import '@univerjs/sheets-hyper-link-ui/lib/index.css'
import '@univerjs/sheets-hyper-link/facade'
import '@univerjs/sheets-hyper-link-ui/facade'

univer.registerPlugin(UniverSheetsHyperLinkPlugin)
univer.registerPlugin(UniverSheetsHyperLinkUIPlugin, {
  urlHandler: {
    navigateToOtherWebsite: url => window.open(`${url}?utm_source=univer`, '_blank'),
  },
})
```

## Facade API

### Import (Plugin Mode Only)
```typescript
import '@univerjs/sheets-hyper-link/facade'
```

## Sheet Hyperlinks

### Build Sheet Hyperlink

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const sheets = fWorkbook.getSheets()

// Create hyperlink to cell F6 in first sheet
const sheet1 = sheets[0]
const range = sheet1.getRange('F6')
const hyperlink = range.getUrl()

console.log('Hyperlink:', hyperlink)
```

### Parse Sheet Hyperlink

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Parse hyperlink to get information
const hyperlinkInfo = fWorkbook.parseSheetHyperlink(hyperlink)
console.log('Hyperlink info:', hyperlinkInfo)
```

### Navigate to Sheet Hyperlink

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const sheets = fWorkbook.getSheets()

// Switch to second sheet
fWorkbook.setActiveSheet(sheets[1])
console.log('Current sheet:', fWorkbook.getActiveSheet().getSheetName())

// Navigate to hyperlink after 3 seconds
setTimeout(() => {
  fWorkbook.navigateToSheetHyperlink(hyperlink)
  console.log('Navigated to:', fWorkbook.getActiveSheet().getSheetName())
}, 3000)
```

## Cell Hyperlinks

### Create Hyperlink in Cell

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Create hyperlink to Univer website in cell A1
const fRange = fWorksheet.getRange('A1')
const richText = univerAPI.newRichText()
  .insertLink('Univer', 'https://univer.ai/')

fRange.setRichTextValueForCell(richText)
```

### Query Hyperlinks in Cell

```typescript
const fRange = fWorksheet.getRange('A1')

// Get cell value with rich text
const cellValue = fRange.getValue(true)

// Get all hyperlinks in the cell
const hyperlinks = cellValue.getLinks()

console.log('Hyperlinks:', hyperlinks)
hyperlinks.forEach((link) => {
  console.log('Link ID:', link.rangeId)
  console.log('Link URL:', link.url)
})
```

### Update Hyperlink

```typescript
const fRange = fWorksheet.getRange('A1')
const cellValue = fRange.getValue(true)
const hyperlinks = cellValue.getLinks()

// Update hyperlink after 3 seconds
setTimeout(() => {
  const id = hyperlinks[0].rangeId
  const newUrl = 'https://insight.univer.ai/'
  
  const newRichText = cellValue.copy().updateLink(id, newUrl)
  fRange.setRichTextValueForCell(newRichText)
  
  console.log('Hyperlink updated')
}, 3000)
```

### Cancel/Remove Hyperlink

```typescript
const fRange = fWorksheet.getRange('A1')

// Cancel hyperlink after 6 seconds
setTimeout(() => {
  const cellValue = fRange.getValue(true)
  const hyperlinks = cellValue.getLinks()
  
  if (hyperlinks.length > 0) {
    const id = hyperlinks[0].rangeId
    const newRichText = cellValue.copy().cancelLink(id)
    fRange.setRichTextValueForCell(newRichText)
    
    console.log('Hyperlink removed')
  }
}, 6000)
```

## Event Listeners

### Link Addition Event

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.BeforeSheetLinkAdd,
  (params) => {
    const { workbook, worksheet, row, col, link } = params
    
    console.log('Adding link:', link)
    
    // Cancel link addition if needed
    // params.cancel = true
  }
)

// Cleanup
disposable.dispose()
```

### Link Update Event

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.BeforeSheetLinkUpdate,
  (params) => {
    const { workbook, worksheet, row, column, id, payload } = params
    
    console.log('Updating link:', id, payload)
    
    // Cancel link update if needed
    // params.cancel = true
  }
)

// Cleanup
disposable.dispose()
```

### Link Deletion Event

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.BeforeSheetLinkCancel,
  (params) => {
    const { workbook, worksheet, row, column, id } = params
    
    console.log('Removing link:', id)
    
    // Cancel link removal if needed
    // params.cancel = true
  }
)

// Cleanup
disposable.dispose()
```

## Complete Examples

### Example 1: Create Multiple Hyperlinks

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Create hyperlinks to different websites
const links = [
  { cell: 'A1', text: 'Univer', url: 'https://univer.ai/' },
  { cell: 'A2', text: 'GitHub', url: 'https://github.com/dream-num/univer' },
  { cell: 'A3', text: 'Docs', url: 'https://docs.univer.ai/' },
]

links.forEach(({ cell, text, url }) => {
  const fRange = fWorksheet.getRange(cell)
  const richText = univerAPI.newRichText().insertLink(text, url)
  fRange.setRichTextValueForCell(richText)
})

console.log('Created', links.length, 'hyperlinks')
```

### Example 2: Internal Navigation

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create navigation links to different sheets
const sheets = fWorkbook.getSheets()

sheets.forEach((sheet, index) => {
  const navSheet = fWorkbook.getSheets()[0] // Navigation sheet
  const cell = `A${index + 1}`
  const range = navSheet.getRange(cell)
  
  // Create link to specific cell in target sheet
  const targetRange = sheet.getRange('A1')
  const hyperlink = targetRange.getUrl()
  
  const richText = univerAPI.newRichText()
    .insertLink(`Go to ${sheet.getSheetName()}`, hyperlink)
  
  range.setRichTextValueForCell(richText)
})
```

### Example 3: Email Links

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Create email link
const fRange = fWorksheet.getRange('A1')
const richText = univerAPI.newRichText()
  .insertLink('Contact Us', 'mailto:support@example.com?subject=Support Request')

fRange.setRichTextValueForCell(richText)
```

### Example 4: Conditional Hyperlinks

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Add hyperlinks based on cell values
const dataRange = fWorksheet.getRange('A1:A10')
const values = dataRange.getValues()

values.forEach((row, index) => {
  const value = row[0]
  
  if (value && typeof value === 'string') {
    // Check if value looks like a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const cell = fWorksheet.getRange(index, 0)
      const richText = univerAPI.newRichText()
        .insertLink(value, value)
      
      cell.setRichTextValueForCell(richText)
    }
  }
})
```

### Example 5: Custom Hook

```typescript
import { useCallback } from 'react'

export const useUniverHyperlink = (univerAPI: FUniver | null) => {
  const addHyperlink = useCallback(
    (cell: string, text: string, url: string) => {
      if (!univerAPI) return

      const workbook = univerAPI.getActiveWorkbook()
      const worksheet = workbook.getActiveSheet()
      const range = worksheet.getRange(cell)

      const richText = univerAPI.newRichText().insertLink(text, url)
      range.setRichTextValueForCell(richText)
    },
    [univerAPI]
  )

  const removeHyperlink = useCallback(
    (cell: string) => {
      if (!univerAPI) return

      const workbook = univerAPI.getActiveWorkbook()
      const worksheet = workbook.getActiveSheet()
      const range = worksheet.getRange(cell)

      const cellValue = range.getValue(true)
      const hyperlinks = cellValue.getLinks()

      if (hyperlinks.length > 0) {
        const id = hyperlinks[0].rangeId
        const newRichText = cellValue.copy().cancelLink(id)
        range.setRichTextValueForCell(newRichText)
      }
    },
    [univerAPI]
  )

  const updateHyperlink = useCallback(
    (cell: string, newUrl: string) => {
      if (!univerAPI) return

      const workbook = univerAPI.getActiveWorkbook()
      const worksheet = workbook.getActiveSheet()
      const range = worksheet.getRange(cell)

      const cellValue = range.getValue(true)
      const hyperlinks = cellValue.getLinks()

      if (hyperlinks.length > 0) {
        const id = hyperlinks[0].rangeId
        const newRichText = cellValue.copy().updateLink(id, newUrl)
        range.setRichTextValueForCell(newRichText)
      }
    },
    [univerAPI]
  )

  return { addHyperlink, removeHyperlink, updateHyperlink }
}

// Usage
const { addHyperlink, removeHyperlink, updateHyperlink } = useUniverHyperlink(univerAPI)

addHyperlink('A1', 'Click here', 'https://example.com')
updateHyperlink('A1', 'https://newurl.com')
removeHyperlink('A1')
```

## Best Practices

### 1. Use Descriptive Link Text

```typescript
// ❌ Bad: Non-descriptive text
richText.insertLink('Click here', url)

// ✅ Good: Descriptive text
richText.insertLink('View Documentation', url)
```

### 2. Validate URLs

```typescript
// ✅ Good: Validate URL before creating link
const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

if (isValidUrl(url)) {
  richText.insertLink(text, url)
} else {
  console.error('Invalid URL:', url)
}
```

### 3. Handle External Links Safely

```typescript
// ✅ Good: Custom URL handler for security
UniverSheetsHyperLinkPreset({
  urlHandler: {
    navigateToOtherWebsite: (url) => {
      // Validate URL
      if (isValidUrl(url) && isSafeUrl(url)) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        console.warn('Blocked unsafe URL:', url)
      }
    },
  },
})
```

### 4. Cleanup Event Listeners

```typescript
// ✅ Good: Always cleanup
useEffect(() => {
  if (!univerAPI) return

  const disposable = univerAPI.addEvent(
    univerAPI.Event.BeforeSheetLinkAdd,
    handleLinkAdd
  )

  return () => {
    disposable.dispose()
  }
}, [univerAPI])
```

## Common Use Cases

### 1. Table of Contents

```typescript
// Create TOC with links to sections
const sections = [
  { name: 'Introduction', cell: 'A10' },
  { name: 'Data', cell: 'A50' },
  { name: 'Summary', cell: 'A100' },
]

sections.forEach(({ name, cell }, index) => {
  const tocCell = fWorksheet.getRange(`A${index + 1}`)
  const targetRange = fWorksheet.getRange(cell)
  const hyperlink = targetRange.getUrl()
  
  const richText = univerAPI.newRichText().insertLink(name, hyperlink)
  tocCell.setRichTextValueForCell(richText)
})
```

### 2. Cross-Sheet References

```typescript
// Link to specific cell in another sheet
const targetSheet = fWorkbook.getSheets()[1]
const targetCell = targetSheet.getRange('B5')
const hyperlink = targetCell.getUrl()

const linkCell = fWorksheet.getRange('A1')
const richText = univerAPI.newRichText()
  .insertLink('View Details', hyperlink)

linkCell.setRichTextValueForCell(richText)
```

### 3. Dynamic Links from Data

```typescript
// Create links from URL column
const urlColumn = fWorksheet.getRange('B1:B10')
const urls = urlColumn.getValues()

urls.forEach((row, index) => {
  const url = row[0]
  if (url && typeof url === 'string') {
    const linkCell = fWorksheet.getRange(index, 0) // Column A
    const richText = univerAPI.newRichText()
      .insertLink('Open', url)
    
    linkCell.setRichTextValueForCell(richText)
  }
})
```

## Troubleshooting

### Issue 1: Link Not Clickable
**Problem**: Hyperlink tidak bisa diklik

**Solution**: Pastikan menggunakan rich text
```typescript
// ✅ Correct: Use rich text
const richText = univerAPI.newRichText().insertLink(text, url)
fRange.setRichTextValueForCell(richText)

// ❌ Wrong: Plain text
fRange.setValue(url)
```

### Issue 2: Link Opens in Same Tab
**Problem**: Link membuka di tab yang sama

**Solution**: Configure URL handler
```typescript
UniverSheetsHyperLinkPreset({
  urlHandler: {
    navigateToOtherWebsite: url => window.open(url, '_blank'),
  },
})
```

### Issue 3: Cannot Remove Link
**Problem**: Tidak bisa menghapus hyperlink

**Solution**: Use cancelLink method
```typescript
const cellValue = fRange.getValue(true)
const hyperlinks = cellValue.getLinks()

if (hyperlinks.length > 0) {
  const id = hyperlinks[0].rangeId
  const newRichText = cellValue.copy().cancelLink(id)
  fRange.setRichTextValueForCell(newRichText)
}
```

## API Reference

### FRange Methods
- `getUrl()`: Get hyperlink URL for range
- `setRichTextValueForCell(richText)`: Set rich text with hyperlink

### FWorkbook Methods
- `parseSheetHyperlink(hyperlink)`: Parse hyperlink info
- `navigateToSheetHyperlink(hyperlink)`: Navigate to hyperlink

### FRichText Methods
- `insertLink(text, url)`: Insert hyperlink
- `updateLink(id, url)`: Update hyperlink
- `cancelLink(id)`: Remove hyperlink
- `getLinks()`: Get all hyperlinks

### Events
- `BeforeSheetLinkAdd`: Before link added (cancellable)
- `BeforeSheetLinkUpdate`: Before link updated (cancellable)
- `BeforeSheetLinkCancel`: Before link removed (cancellable)

## Referensi

- [Facade API Reference](https://reference.univer.ai/)
- [Official Documentation](https://docs.univer.ai/guides/sheets/features/hyper-link)
- [Rich Text Guide](./rich-text.md)
