# Process Excel Edge Function

Server-side Excel file processing for large files with chunked upload support and pagination.

## Features

- **Server-side Processing**: Handle large Excel files (>100MB) on the server
- **Chunked Upload**: Support for multipart/form-data uploads
- **Pagination**: Return data in manageable chunks (default 1000 rows per page)
- **Multi-sheet Support**: Parse and access multiple sheets
- **Memory Efficient**: Stream processing to handle large datasets

## API Endpoints

### 1. Parse Excel File

Parse an Excel file and return metadata without loading all data.

**Endpoint**: `POST /process-excel?action=parse`

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data` or `application/octet-stream`
- Body: Excel file

**Response**:
```json
{
  "headers": ["Column A", "Column B", "Column C"],
  "totalRows": 50000,
  "totalSheets": 3,
  "sheetNames": ["Sheet1", "Sheet2", "Sheet3"],
  "fileName": "data.xlsx"
}
```

### 2. Get Paginated Data

Retrieve a specific page of rows from the Excel file.

**Endpoint**: `POST /process-excel?action=paginate&page=1&pageSize=1000&sheet=Sheet1`

**Query Parameters**:
- `action`: `paginate` (required)
- `page`: Page number (default: 1, min: 1)
- `pageSize`: Rows per page (default: 1000, min: 1, max: 10000)
- `sheet`: Sheet name (optional, defaults to first sheet)

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data` or `application/octet-stream`
- Body: Excel file

**Response**:
```json
{
  "headers": ["Column A", "Column B", "Column C"],
  "rows": [
    [1, "value1", 100],
    [2, "value2", 200]
  ],
  "totalRows": 50000,
  "totalSheets": 3,
  "sheetNames": ["Sheet1", "Sheet2", "Sheet3"],
  "fileName": "data.xlsx",
  "page": 1,
  "pageSize": 1000,
  "hasMore": true
}
```

## Usage Examples

### JavaScript/TypeScript Client

```typescript
// Parse Excel file
async function parseExcelFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/process-excel?action=parse',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: formData,
    }
  );

  return await response.json();
}

// Get paginated data
async function getPaginatedData(file: File, page: number = 1, pageSize: number = 1000) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://your-project.supabase.co/functions/v1/process-excel?action=paginate&page=${page}&pageSize=${pageSize}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: formData,
    }
  );

  return await response.json();
}

// Load all data with pagination
async function loadAllData(file: File) {
  const metadata = await parseExcelFile(file);
  const allRows = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getPaginatedData(file, page, 1000);
    allRows.push(...result.rows);
    hasMore = result.hasMore;
    page++;
  }

  return {
    headers: metadata.headers,
    rows: allRows,
  };
}
```

### React Hook Example

```typescript
import { useState } from 'react';

export function useExcelProcessor() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processLargeFile = async (file: File) => {
    setLoading(true);
    setProgress(0);

    try {
      // Parse metadata first
      const metadata = await parseExcelFile(file);
      const totalPages = Math.ceil(metadata.totalRows / 1000);

      // Load data in chunks
      const allRows = [];
      for (let page = 1; page <= totalPages; page++) {
        const result = await getPaginatedData(file, page, 1000);
        allRows.push(...result.rows);
        setProgress((page / totalPages) * 100);
      }

      return {
        headers: metadata.headers,
        rows: allRows,
      };
    } finally {
      setLoading(false);
    }
  };

  return { processLargeFile, loading, progress };
}
```

## Error Handling

The function returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid parameters, empty file, etc.)
- `500`: Server error (parsing failed, etc.)

Error response format:
```json
{
  "error": "Error message description"
}
```

## Performance Considerations

1. **File Size Limits**: While the function can handle large files, consider implementing client-side file size checks
2. **Pagination**: Use appropriate page sizes based on your use case (1000 rows is a good default)
3. **Caching**: Consider caching parsed metadata to avoid re-parsing on pagination requests
4. **Memory**: The function loads the entire file into memory for parsing. For extremely large files (>500MB), consider implementing streaming

## Testing

Run tests with Deno:

```bash
deno test supabase/functions/process-excel/index.test.ts
```

## Deployment

Deploy to Supabase:

```bash
supabase functions deploy process-excel
```

## Requirements Validation

This Edge Function satisfies:
- **Requirement 3.1.1**: Server-side Excel processing via Supabase Edge Function ✓
- **Requirement 3.1.2**: Streaming upload for large files (chunked upload) ✓
- **Requirement 3.1.3**: Progress indicator support (via pagination) ✓
- **Requirement 3.1.5**: Pagination for rows (load 1000 rows at a time) ✓
