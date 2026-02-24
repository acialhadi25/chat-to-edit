# Find & Replace - Univer Sheet

## Overview

Find & Replace feature memungkinkan user untuk mencari konten spesifik dalam spreadsheet dan menggantinya, mendukung berbagai opsi matching untuk membantu user memproses data secara efisien.

## Installation

### Preset Mode
```bash
npm install @univerjs/preset-sheets-find-replace
```

```typescript
import { UniverSheetsFindReplacePreset } from '@univerjs/preset-sheets-find-replace'
import UniverPresetSheetsFindReplaceEnUS from '@univerjs/preset-sheets-find-replace/locales/en-US'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsFindReplaceEnUS,
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsFindReplacePreset(),
  ],
})
```

### Plugin Mode
```bash
npm install @univerjs/find-replace @univerjs/sheets-find-replace
```

```typescript
import { UniverFindReplacePlugin } from '@univerjs/find-replace'
import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace'
import '@univerjs/find-replace/lib/index.css'
import '@univerjs/sheets-find-replace/facade'

univer.registerPlugin(UniverFindReplacePlugin)
univer.registerPlugin(UniverSheetsFindReplacePlugin)
```

## Facade API

### Import (Plugin Mode Only)
```typescript
import '@univerjs/sheets-find-replace/facade'
```

## Create Text Finder

### Basic Usage

```typescript
// Create text finder untuk mencari '5'
const textFinder = await univerAPI.createTextFinderAsync('5')
```

## FTextFinder Methods

### findAll()
Mendapatkan semua cell yang match di current sheet.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('5')
const matchCells = textFinder.findAll()

matchCells.forEach((cell) => {
  console.log(cell.getA1Notation()) // D2, C3, B4, A5
})
```

### findNext()
Mendapatkan cell match berikutnya.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('5')

// Find first match
const firstMatch = textFinder.findNext()
console.log(firstMatch?.getA1Notation())

// Find next match
const secondMatch = textFinder.findNext()
console.log(secondMatch?.getA1Notation())
```

### findPrevious()
Mendapatkan cell match sebelumnya.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('5')

// Find last match
const lastMatch = textFinder.findPrevious()
console.log(lastMatch?.getA1Notation())
```

### getCurrentMatch()
Mendapatkan current matched cell.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('5')
textFinder.findNext()

const currentMatch = textFinder.getCurrentMatch()
console.log(currentMatch?.getA1Notation())
```

## Search Options

### matchCaseAsync()
Set case-sensitive matching.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('hello')

// Case-sensitive search
await textFinder.matchCaseAsync(true)
const matches = textFinder.findAll() // Only finds 'hello', not 'Hello' or 'HELLO'
```

### matchEntireCellAsync()
Set untuk match entire cell value.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('5')

// Match entire cell
await textFinder.matchEntireCellAsync(true)
const matches = textFinder.findAll() // Only finds cells with exactly '5', not '15' or '50'
```

### matchFormulaTextAsync()
Set untuk match formula text instead of value.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('SUM')

// Match formula text
await textFinder.matchFormulaTextAsync(true)
const matches = textFinder.findAll() // Finds cells with formulas containing 'SUM'
```

## Replace Operations

### replaceWithAsync()
Replace current matched text.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('old')
textFinder.findNext()

// Replace current match
await textFinder.replaceWithAsync('new')
```

### replaceAllWithAsync()
Replace semua matched text.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('old')

// Replace all occurrences
await textFinder.replaceAllWithAsync('new')
```

## Advanced Usage

### ensureCompleteAsync()
Ensure find operation is completed, terutama saat sheet berubah.

```typescript
const textFinder = await univerAPI.createTextFinderAsync('search')

// Switch sheet
fWorkbook.setActiveSheet(anotherSheet)

// Ensure find operation is complete
await textFinder.ensureCompleteAsync()
```

## Complete Examples

### Example 1: Basic Find

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Setup data
const fRange = fWorksheet.getRange('A1:D10')
fRange.setValues([
  [1, 2, 3, 4],
  [2, 3, 4, 5],
  [3, 4, 5, 6],
  [4, 5, 6, 7],
  [5, 6, 7, 8],
  [6, 7, 8, 9],
  [7, 8, 9, 10],
  [8, 9, 10, 11],
  [9, 10, 11, 12],
  [10, 11, 12, 13],
])

// Find all cells containing '5'
const textFinder = await univerAPI.createTextFinderAsync('5')
const matchCells = textFinder.findAll()

console.log(`Found ${matchCells.length} matches`)
matchCells.forEach((cell) => {
  console.log(cell.getA1Notation(), cell.getValue())
})
```

### Example 2: Case-Sensitive Find

```typescript
const textFinder = await univerAPI.createTextFinderAsync('Hello')

// Enable case-sensitive matching
await textFinder.matchCaseAsync(true)

const matches = textFinder.findAll()
console.log(`Found ${matches.length} case-sensitive matches`)
```

### Example 3: Find and Replace

```typescript
// Find 'old' and replace with 'new'
const textFinder = await univerAPI.createTextFinderAsync('old')

// Replace all occurrences
await textFinder.replaceAllWithAsync('new')

console.log('All occurrences replaced')
```

### Example 4: Find in Formulas

```typescript
// Find cells with SUM formula
const textFinder = await univerAPI.createTextFinderAsync('SUM')

// Match formula text
await textFinder.matchFormulaTextAsync(true)

const formulaCells = textFinder.findAll()
console.log(`Found ${formulaCells.length} cells with SUM formula`)

formulaCells.forEach((cell) => {
  console.log(cell.getA1Notation(), cell.getFormula())
})
```

### Example 5: Interactive Find & Replace

```typescript
const findAndReplace = async (
  searchText: string,
  replaceText: string,
  options: {
    matchCase?: boolean
    matchEntireCell?: boolean
    matchFormula?: boolean
  } = {}
) => {
  const textFinder = await univerAPI.createTextFinderAsync(searchText)

  // Apply options
  if (options.matchCase) {
    await textFinder.matchCaseAsync(true)
  }
  if (options.matchEntireCell) {
    await textFinder.matchEntireCellAsync(true)
  }
  if (options.matchFormula) {
    await textFinder.matchFormulaTextAsync(true)
  }

  // Find all matches
  const matches = textFinder.findAll()
  console.log(`Found ${matches.length} matches`)

  // Replace all
  if (matches.length > 0) {
    await textFinder.replaceAllWithAsync(replaceText)
    console.log(`Replaced ${matches.length} occurrences`)
  }

  return matches.length
}

// Usage
const count = await findAndReplace('old', 'new', {
  matchCase: true,
  matchEntireCell: false,
})
```

### Example 6: Custom Hook

```typescript
import { useCallback } from 'react'

export const useUniverFindReplace = (univerAPI: FUniver | null) => {
  const find = useCallback(
    async (searchText: string, options = {}) => {
      if (!univerAPI) return []

      const textFinder = await univerAPI.createTextFinderAsync(searchText)

      if (options.matchCase) {
        await textFinder.matchCaseAsync(true)
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true)
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true)
      }

      return textFinder.findAll()
    },
    [univerAPI]
  )

  const replace = useCallback(
    async (searchText: string, replaceText: string, options = {}) => {
      if (!univerAPI) return 0

      const textFinder = await univerAPI.createTextFinderAsync(searchText)

      if (options.matchCase) {
        await textFinder.matchCaseAsync(true)
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true)
      }

      const matches = textFinder.findAll()
      if (matches.length > 0) {
        await textFinder.replaceAllWithAsync(replaceText)
      }

      return matches.length
    },
    [univerAPI]
  )

  return { find, replace }
}

// Usage in component
const { find, replace } = useUniverFindReplace(univerAPI)

const handleFind = async () => {
  const matches = await find('search term', { matchCase: true })
  console.log(`Found ${matches.length} matches`)
}

const handleReplace = async () => {
  const count = await replace('old', 'new', { matchCase: true })
  console.log(`Replaced ${count} occurrences`)
}
```

## Best Practices

### 1. Always Use Async/Await

```typescript
// ✅ Good: Use async/await
const textFinder = await univerAPI.createTextFinderAsync('search')
await textFinder.matchCaseAsync(true)
await textFinder.replaceAllWithAsync('replace')

// ❌ Bad: Missing await
const textFinder = univerAPI.createTextFinderAsync('search')
textFinder.matchCaseAsync(true)
```

### 2. Check Match Count Before Replace

```typescript
// ✅ Good: Check before replace
const textFinder = await univerAPI.createTextFinderAsync('old')
const matches = textFinder.findAll()

if (matches.length > 0) {
  const confirm = window.confirm(
    `Replace ${matches.length} occurrences?`
  )
  if (confirm) {
    await textFinder.replaceAllWithAsync('new')
  }
}
```

### 3. Handle Empty Results

```typescript
// ✅ Good: Handle empty results
const textFinder = await univerAPI.createTextFinderAsync('search')
const matches = textFinder.findAll()

if (matches.length === 0) {
  console.log('No matches found')
  return
}

// Process matches
matches.forEach((cell) => {
  console.log(cell.getA1Notation())
})
```

### 4. Use Appropriate Options

```typescript
// ✅ Good: Use appropriate options for use case
const textFinder = await univerAPI.createTextFinderAsync('email@example.com')

// For exact email match
await textFinder.matchEntireCellAsync(true)

// For case-sensitive search
await textFinder.matchCaseAsync(true)
```

## Common Use Cases

### 1. Find Empty Cells

```typescript
const textFinder = await univerAPI.createTextFinderAsync('')
await textFinder.matchEntireCellAsync(true)
const emptyCells = textFinder.findAll()
```

### 2. Find and Highlight

```typescript
const textFinder = await univerAPI.createTextFinderAsync('important')
const matches = textFinder.findAll()

matches.forEach((cell) => {
  cell.setBackground('yellow')
  cell.setFontColor('red')
})
```

### 3. Find in Specific Range

```typescript
// Note: TextFinder searches entire sheet
// For range-specific search, filter results
const textFinder = await univerAPI.createTextFinderAsync('search')
const allMatches = textFinder.findAll()

const rangeMatches = allMatches.filter((cell) => {
  const row = cell.getRow()
  const col = cell.getColumn()
  return row >= 0 && row < 10 && col >= 0 && col < 5
})
```

## Troubleshooting

### Issue 1: No Matches Found
**Problem**: Find tidak menemukan hasil yang diharapkan

**Solution**: Check search options
```typescript
// Try without options first
const textFinder = await univerAPI.createTextFinderAsync('search')
const matches = textFinder.findAll()

// If no matches, try with different options
await textFinder.matchCaseAsync(false)
await textFinder.matchEntireCellAsync(false)
```

### Issue 2: Replace Not Working
**Problem**: Replace tidak mengubah data

**Solution**: Ensure await is used
```typescript
// ✅ Correct
await textFinder.replaceAllWithAsync('new')

// ❌ Wrong
textFinder.replaceAllWithAsync('new') // Missing await
```

## API Reference

### univerAPI.createTextFinderAsync()
```typescript
createTextFinderAsync(searchText: string): Promise<FTextFinder>
```

### FTextFinder Methods
- `findAll()`: Find all matches
- `findNext()`: Find next match
- `findPrevious()`: Find previous match
- `getCurrentMatch()`: Get current match
- `matchCaseAsync(value: boolean)`: Set case-sensitive
- `matchEntireCellAsync(value: boolean)`: Set match entire cell
- `matchFormulaTextAsync(value: boolean)`: Set match formula
- `replaceWithAsync(replaceText: string)`: Replace current
- `replaceAllWithAsync(replaceText: string)`: Replace all
- `ensureCompleteAsync()`: Ensure operation complete

## Referensi

- [Facade API Reference](https://reference.univer.ai/)
- [Official Documentation](https://docs.univer.ai/guides/sheets/features/find-replace)
