# Univer Sheet - UniScript

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

UniScript adalah fitur yang memungkinkan eksekusi kode JavaScript secara online dalam Univer Sheet, memberikan akses ke Facade API untuk automasi dan scripting.

### Fitur Utama
- **Online Code Execution**: Jalankan JavaScript code langsung di browser
- **Facade API Access**: Akses penuh ke Univer Facade API
- **Sidebar Panel**: UI panel untuk menulis dan menjalankan script
- **Script Management**: Save, load, dan manage scripts
- **Real-time Execution**: Eksekusi code secara real-time
- **Error Handling**: Error reporting yang jelas

### Kapan Menggunakan
- Automasi task berulang
- Custom functions dan macros
- Data processing dan transformation
- Batch operations
- Testing dan debugging
- Prototyping fitur baru

### Keuntungan
- No server-side setup required
- Full access ke Univer API
- Interactive development
- Quick prototyping
- Learning tool untuk Univer API
- Extensibility


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/uniscript @univerjs/uniscript-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverUniScriptPlugin } from '@univerjs/uniscript';
import { UniverUniScriptUIPlugin } from '@univerjs/uniscript-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/uniscript-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register UniScript plugins
univerAPI.registerPlugin(UniverUniScriptPlugin);
univerAPI.registerPlugin(UniverUniScriptUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/uniscript @univerjs/uniscript-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverUniScriptPlugin } from '@univerjs/uniscript';
import { UniverUniScriptUIPlugin } from '@univerjs/uniscript-ui';

const univer = new Univer();

// Register UniScript plugins
univer.registerPlugin(UniverUniScriptPlugin);
univer.registerPlugin(UniverUniScriptUIPlugin);
```

### Configuration

```typescript
// Configure UniScript with options
univerAPI.registerPlugin(UniverUniScriptPlugin, {
  // Enable/disable features
  enableAutoComplete: true,
  enableSyntaxHighlight: true,
  maxExecutionTime: 5000, // 5 seconds timeout
});
```


## API Reference

### Available APIs in UniScript

Dalam UniScript, Anda memiliki akses ke:

```typescript
// Global univerAPI object
univerAPI

// Get workbook
const workbook = univerAPI.getActiveWorkbook();

// Get worksheet
const worksheet = workbook.getActiveSheet();

// All Facade API methods available
```

### Script Execution Context

```typescript
// Scripts run in isolated context with access to:
// - univerAPI: Main API object
// - console: For logging
// - setTimeout/setInterval: For async operations
// - Promise: For async/await
```

### Common Patterns

#### Get and Set Values

```typescript
// Get value
const range = worksheet.getRange('A1');
const value = range.getValue();

// Set value
range.setValue('New Value');
```

#### Iterate Ranges

```typescript
// Iterate through range
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

values.forEach((row, index) => {
  console.log(`Row ${index}:`, row[0]);
});
```

#### Batch Operations

```typescript
// Batch update
const data = [
  ['Name', 'Age'],
  ['John', 30],
  ['Jane', 25],
];

worksheet.getRange('A1:B3').setValues(data);
```


## Contoh Penggunaan

### 1. Hello World Script

```javascript
// Simple hello world
const workbook = univerAPI.getActiveWorkbook();
const worksheet = workbook.getActiveSheet();

worksheet.getRange('A1').setValue('Hello from UniScript!');
console.log('Script executed successfully');
```

### 2. Fill Series

```javascript
// Fill series 1-10 in column A
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();

for (let i = 1; i <= 10; i++) {
  worksheet.getRange(`A${i}`).setValue(i);
}

console.log('Series filled');
```

### 3. Sum Column

```javascript
// Calculate sum of column A
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

let sum = 0;
values.forEach(row => {
  const value = parseFloat(row[0]);
  if (!isNaN(value)) {
    sum += value;
  }
});

worksheet.getRange('A11').setValue(sum);
console.log('Sum:', sum);
```

### 4. Data Transformation

```javascript
// Convert text to uppercase
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

const uppercased = values.map(row => [row[0].toString().toUpperCase()]);
range.setValues(uppercased);

console.log('Text converted to uppercase');
```

### 5. Conditional Formatting via Script

```javascript
// Highlight cells > 50
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

values.forEach((row, index) => {
  const value = parseFloat(row[0]);
  if (value > 50) {
    const cell = worksheet.getRange(`A${index + 1}`);
    cell.setBackgroundColor('#ffff00'); // Yellow
  }
});

console.log('Conditional formatting applied');
```

### 6. Create Table

```javascript
// Create a simple table
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();

const data = [
  ['Name', 'Age', 'City'],
  ['John', 30, 'New York'],
  ['Jane', 25, 'London'],
  ['Bob', 35, 'Paris'],
];

worksheet.getRange('A1:C4').setValues(data);

// Format header
const header = worksheet.getRange('A1:C1');
header.setFontWeight('bold');
header.setBackgroundColor('#4CAF50');
header.setFontColor('#ffffff');

console.log('Table created');
```

### 7. Find and Replace

```javascript
// Find and replace text
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

const replaced = values.map(row => {
  const text = row[0].toString();
  return [text.replace('old', 'new')];
});

range.setValues(replaced);
console.log('Find and replace completed');
```

### 8. Generate Random Data

```javascript
// Generate random numbers
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();

const data = [];
for (let i = 0; i < 10; i++) {
  data.push([Math.floor(Math.random() * 100)]);
}

worksheet.getRange('A1:A10').setValues(data);
console.log('Random data generated');
```

### 9. Copy Range

```javascript
// Copy range A1:A10 to B1:B10
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();

const source = worksheet.getRange('A1:A10');
const values = source.getValues();

const destination = worksheet.getRange('B1:B10');
destination.setValues(values);

console.log('Range copied');
```

### 10. Data Validation

```javascript
// Validate data in range
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet();
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

let errors = [];
values.forEach((row, index) => {
  const value = parseFloat(row[0]);
  if (isNaN(value) || value < 0 || value > 100) {
    errors.push(`Row ${index + 1}: Invalid value`);
  }
});

if (errors.length > 0) {
  console.error('Validation errors:', errors);
} else {
  console.log('All data valid');
}
```


## Best Practices

### Do's ✅

1. **Use Console Logging**
```javascript
// Good - Log progress
console.log('Starting script...');
// ... operations
console.log('Script completed');
```

2. **Handle Errors**
```javascript
// Good - Try-catch for error handling
try {
  const range = worksheet.getRange('A1');
  range.setValue('Test');
} catch (error) {
  console.error('Error:', error.message);
}
```

3. **Validate Input**
```javascript
// Good - Validate before processing
const value = range.getValue();
if (typeof value === 'number' && value > 0) {
  // Process value
} else {
  console.error('Invalid input');
}
```

4. **Use Batch Operations**
```javascript
// Good - Batch update
const data = [[1], [2], [3], [4], [5]];
worksheet.getRange('A1:A5').setValues(data);

// Bad - Individual updates
for (let i = 1; i <= 5; i++) {
  worksheet.getRange(`A${i}`).setValue(i); // Slow
}
```

5. **Comment Your Code**
```javascript
// Good - Clear comments
// Calculate total sales for Q1
const q1Range = worksheet.getRange('B2:B4');
const q1Values = q1Range.getValues();
const q1Total = q1Values.reduce((sum, row) => sum + row[0], 0);
```

### Don'ts ❌

1. **Jangan Infinite Loops**
```javascript
// Bad - Infinite loop
while (true) {
  // This will hang the browser
}

// Good - Controlled loop
for (let i = 0; i < 100; i++) {
  // Process
}
```

2. **Jangan Ignore Performance**
```javascript
// Bad - Slow individual operations
for (let i = 1; i <= 1000; i++) {
  worksheet.getRange(`A${i}`).setValue(i);
}

// Good - Batch operation
const data = Array.from({ length: 1000 }, (_, i) => [i + 1]);
worksheet.getRange('A1:A1000').setValues(data);
```

3. **Jangan Hardcode Values**
```javascript
// Bad - Hardcoded
worksheet.getRange('A1').setValue('John');

// Good - Use variables
const name = 'John';
worksheet.getRange('A1').setValue(name);
```

4. **Jangan Lupa Cleanup**
```javascript
// Bad - No cleanup
const interval = setInterval(() => {
  // Do something
}, 1000);

// Good - Clear interval
const interval = setInterval(() => {
  // Do something
}, 1000);

setTimeout(() => {
  clearInterval(interval);
}, 10000);
```


## Troubleshooting

### Script Tidak Berjalan

**Gejala**: Script tidak execute

**Solusi**:
```javascript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverUniScriptPlugin);
univerAPI.registerPlugin(UniverUniScriptUIPlugin);

// 2. Check syntax errors
// Use console.log to debug
console.log('Script started');

// 3. Verify univerAPI is available
if (typeof univerAPI !== 'undefined') {
  console.log('univerAPI available');
} else {
  console.error('univerAPI not found');
}
```

### Timeout Error

**Gejala**: Script timeout setelah beberapa detik

**Solusi**:
```javascript
// 1. Optimize script performance
// Use batch operations instead of loops

// 2. Increase timeout in configuration
univerAPI.registerPlugin(UniverUniScriptPlugin, {
  maxExecutionTime: 10000, // 10 seconds
});

// 3. Break long operations into chunks
async function processLargeData() {
  const chunkSize = 100;
  for (let i = 0; i < totalRows; i += chunkSize) {
    // Process chunk
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Cannot Access Range

**Gejala**: Error saat mengakses range

**Solusi**:
```javascript
// 1. Verify workbook and worksheet exist
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) {
  console.error('No active workbook');
  return;
}

const worksheet = workbook.getActiveSheet();
if (!worksheet) {
  console.error('No active worksheet');
  return;
}

// 2. Validate range address
try {
  const range = worksheet.getRange('A1');
  console.log('Range accessed successfully');
} catch (error) {
  console.error('Invalid range:', error);
}
```

### Values Tidak Update

**Gejala**: setValue() tidak mengubah cell

**Solusi**:
```javascript
// 1. Ensure proper value type
const range = worksheet.getRange('A1');
range.setValue(123); // Number
range.setValue('Text'); // String
range.setValue(true); // Boolean

// 2. Check for errors
try {
  range.setValue(value);
  console.log('Value set successfully');
} catch (error) {
  console.error('Failed to set value:', error);
}

// 3. Verify range is not protected
// Check if range has write permissions
```

### Memory Issues

**Gejala**: Browser slow atau crash

**Solusi**:
```javascript
// 1. Process data in chunks
const CHUNK_SIZE = 100;
const totalRows = 10000;

for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
  const end = Math.min(i + CHUNK_SIZE, totalRows);
  const range = worksheet.getRange(`A${i + 1}:A${end}`);
  // Process chunk
}

// 2. Clear large variables
let largeArray = new Array(10000);
// Use largeArray
largeArray = null; // Clear reference

// 3. Avoid storing unnecessary data
// Don't keep all data in memory
```

## Referensi

### Official Documentation
- [Univer UniScript Guide](https://docs.univer.ai/guides/sheets/features/uniscript)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Complete API reference
- [Sheets API](../core/sheets-api.md) - Worksheet operations
- [Formula](../core/formula.md) - Formula functions

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)
- [Script Examples](https://github.com/dream-num/univer/tree/main/examples/uniscript)

### Learning Resources
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Async/Await Guide](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs/uniscript, @univerjs/uniscript-ui
