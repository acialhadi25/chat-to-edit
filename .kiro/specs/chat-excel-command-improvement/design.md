# Design Document: Chat Excel Command Improvement

## Overview

Dokumen design ini menjelaskan solusi teknis untuk memperbaiki fitur Chat-to-Excel dengan fokus pada tiga area utama:

1. **Robust JSON Parsing**: Implementasi multi-strategy parsing untuk menangani berbagai format respons AI
2. **UI Chat Bubble Optimization**: Perbaikan layout dan styling untuk memastikan semua konten terbaca
3. **Command Execution Reliability**: Validasi parameter dan error handling yang komprehensif

Solusi ini akan meningkatkan success rate eksekusi perintah dari ~60% menjadi >95% dan menghilangkan masalah UI yang membuat teks tidak terbaca.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  ChatInterface  │ (UI Layer)
│   Component     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stream Handler │ (Network Layer)
│   streamChat()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Parser    │ (Parsing Layer)
│ robustJsonParse │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Command Executor│ (Business Logic)
│ applyAction()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Excel Data     │ (Data Layer)
│   Mutation      │
└─────────────────┘
```

### Component Responsibilities

- **ChatInterface**: Menampilkan UI, menangani user input, merender chat bubbles
- **Stream Handler**: Mengelola koneksi streaming, mengakumulasi chunks, mendeteksi completion
- **JSON Parser**: Multi-strategy parsing dengan fallback, ekstraksi JSON dari teks
- **Command Executor**: Validasi parameter, eksekusi action, error handling
- **Excel Data Mutation**: Operasi low-level pada data spreadsheet

## Components and Interfaces

### 1. Enhanced JSON Parser (`jsonParser.ts`)

#### Interface Definitions

```typescript
export interface ParseResult<T> {
  success: boolean;
  data: T | null;
  originalText: string;
  parseMethod: 'direct' | 'extracted' | 'regex' | 'fallback';
  error?: string;
  warnings?: string[];
}

export interface AIResponse {
  content: string;
  action?: ActionObject;
  quickOptions?: QuickOption[];
}

export interface ActionObject {
  type: string;
  target?: {
    type: 'cell' | 'range' | 'column' | 'row';
    ref: string;
  };
  // Type-specific parameters
  [key: string]: unknown;
}
```

#### Parsing Strategies

**Strategy 1: Direct JSON Parse**

- Coba parse langsung dengan `JSON.parse()`
- Paling cepat, digunakan untuk respons yang well-formed

**Strategy 2: Extract JSON from Text**

- Ekstrak JSON dari teks yang mengandung komentar
- Regex pattern: `/\{[\s\S]*\}(?:\s*$)/` untuk object
- Regex pattern: `/\[[\s\S]*\](?:\s*$)/` untuk array

**Strategy 3: Brace-Counting Extraction**

- Hitung kurung kurawal untuk menemukan JSON object yang valid
- Menangani nested objects dan escaped strings
- Fallback untuk respons yang sangat malformed

**Strategy 4: Fallback Object**

- Return default object dengan type INFO
- Preserve original text untuk debugging
- Log warning untuk monitoring

#### Enhanced Functions

```typescript
// Main parsing function dengan semua strategies
function robustJsonParse<T>(text: string, fallback: T): ParseResult<T>;

// Specialized parser untuk AI response
function parseAIResponse(text: string): ParseResult<AIResponse>;

// Validasi action object
function validateActionObject(action: ActionObject): ValidationResult;

// Extract action dari teks tanpa wrapper
function extractActionFromText(text: string): ActionObject | null;
```

### 2. Improved Stream Handler (`streamChat.ts`)

#### Stream Processing Flow

```
Fetch Response
     │
     ▼
Read Stream Chunks
     │
     ▼
Decode to Text Buffer
     │
     ▼
Split by Newline
     │
     ▼
Parse SSE Format (data: ...)
     │
     ▼
Extract Content Delta
     │
     ▼
Accumulate Full Text
     │
     ▼
Parse Complete JSON
```

#### Enhanced Error Handling

```typescript
interface StreamError {
  type: 'network' | 'parse' | 'timeout' | 'api';
  status?: number;
  message: string;
  context: string;
  recoverable: boolean;
}

function handleStreamError(error: StreamError): void {
  // Map error ke user-friendly message
  // Log detail untuk debugging
  // Trigger appropriate UI feedback
}
```

#### Incomplete JSON Handling

```typescript
function processStreamLine(
  line: string,
  buffer: string
): {
  processed: boolean;
  remainingBuffer: string;
  content?: string;
} {
  // Coba parse JSON
  // Jika gagal, kembalikan ke buffer
  // Tunggu chunk berikutnya
}
```

### 3. Command Validator (`commandValidator.ts`)

#### Validation Rules

```typescript
interface ValidationRule {
  actionType: string;
  requiredParams: string[];
  optionalParams: string[];
  validator: (action: ActionObject) => ValidationResult;
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  DATA_TRANSFORM: {
    requiredParams: ['transformType', 'target'],
    validator: (action) => {
      if (!['uppercase', 'lowercase', 'titlecase'].includes(action.transformType)) {
        return { valid: false, error: 'transformType must be uppercase, lowercase, or titlecase' };
      }
      return { valid: true };
    },
  },
  FIND_REPLACE: {
    requiredParams: ['findValue', 'replaceValue'],
    validator: (action) => {
      if (typeof action.findValue !== 'string' || typeof action.replaceValue !== 'string') {
        return { valid: false, error: 'findValue and replaceValue must be strings' };
      }
      return { valid: true };
    },
  },
  CONDITIONAL_FORMAT: {
    requiredParams: ['conditionType', 'formatStyle', 'target'],
    validator: (action) => {
      const validConditions = ['=', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains'];
      if (!validConditions.includes(action.conditionType)) {
        return {
          valid: false,
          error: `conditionType must be one of: ${validConditions.join(', ')}`,
        };
      }
      if (!action.formatStyle || typeof action.formatStyle !== 'object') {
        return { valid: false, error: 'formatStyle must be an object' };
      }
      return { valid: true };
    },
  },
  SORT_DATA: {
    requiredParams: ['sortColumn', 'sortDirection'],
    validator: (action) => {
      if (!['asc', 'desc'].includes(action.sortDirection)) {
        return { valid: false, error: "sortDirection must be 'asc' or 'desc'" };
      }
      return { valid: true };
    },
  },
  FILTER_DATA: {
    requiredParams: ['filterOperator', 'filterValue', 'target'],
    validator: (action) => {
      const validOps = [
        '=',
        '!=',
        '>',
        '<',
        '>=',
        '<=',
        'contains',
        'not_contains',
        'empty',
        'not_empty',
      ];
      if (!validOps.includes(action.filterOperator)) {
        return { valid: false, error: `filterOperator must be one of: ${validOps.join(', ')}` };
      }
      return { valid: true };
    },
  },
};

function validateAction(action: ActionObject): ValidationResult {
  const rule = VALIDATION_RULES[action.type];
  if (!rule) {
    return { valid: true }; // Unknown types pass through
  }

  // Check required params
  for (const param of rule.requiredParams) {
    if (!(param in action)) {
      return {
        valid: false,
        error: `Missing required parameter: ${param}`,
        missingParams: [param],
      };
    }
  }

  // Run custom validator
  return rule.validator(action);
}
```

### 4. Enhanced Chat Interface (`ChatInterface.tsx`)

#### Chat Bubble Styling Improvements

```typescript
// Responsive max-width
const chatBubbleStyles = {
  maxWidth: '85%', // Increased from 80%
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
};

// Formula/code block styling
const codeBlockStyles = {
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  backgroundColor: 'var(--code-bg)',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  overflowX: 'auto',
  maxWidth: '100%',
};

// Preview container dengan scroll
const previewStyles = {
  maxHeight: '300px',
  overflowY: 'auto',
  marginTop: '1rem',
};
```

#### Markdown Rendering Enhancement

```typescript
// Gunakan library markdown yang robust
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ node, inline, ...props }) => (
          inline
            ? <code className="inline-code" {...props} />
            : <pre className="code-block"><code {...props} /></pre>
        ),
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### 5. System Prompt Enhancement (`chat/index.ts`)

#### Improved Instruction Clarity

Tambahkan section khusus untuk setiap action type dengan contoh lengkap:

```typescript
const SYSTEM_PROMPT_ADDITIONS = `

## CRITICAL: PARAMETER REQUIREMENTS

Each action type has MANDATORY parameters. Missing parameters will cause execution failure.

### DATA_TRANSFORM
REQUIRED: transformType ("uppercase" | "lowercase" | "titlecase"), target
Example: { "type": "DATA_TRANSFORM", "transformType": "uppercase", "target": { "type": "column", "ref": "A" } }

### FIND_REPLACE
REQUIRED: findValue (string), replaceValue (string)
Example: { "type": "FIND_REPLACE", "findValue": "old", "replaceValue": "new" }

### CONDITIONAL_FORMAT
REQUIRED: conditionType, conditionValues (array), formatStyle (object with color/backgroundColor/fontWeight), target
Example: { "type": "CONDITIONAL_FORMAT", "conditionType": "<", "conditionValues": [50], "formatStyle": { "backgroundColor": "#ef4444", "color": "#ffffff" }, "target": { "type": "column", "ref": "D" } }

### SORT_DATA
REQUIRED: sortColumn (column letter), sortDirection ("asc" | "desc")
Example: { "type": "SORT_DATA", "sortColumn": "B", "sortDirection": "desc" }

### FILTER_DATA
REQUIRED: filterOperator, filterValue, target
Example: { "type": "FILTER_DATA", "filterOperator": "contains", "filterValue": "Paid", "target": { "type": "column", "ref": "E" } }

## RESPONSE VALIDATION

Before sending response, verify:
1. JSON is valid and complete
2. All required parameters are present
3. Parameter values are correct type (string, number, array, object)
4. Color codes use hex format (#rrggbb)
5. Column references use letters (A, B, C...)
6. Row references use numbers (1, 2, 3...)

## COMMON MISTAKES TO AVOID

❌ Missing transformType in DATA_TRANSFORM
❌ Missing findValue or replaceValue in FIND_REPLACE
❌ Missing conditionType or formatStyle in CONDITIONAL_FORMAT
❌ Using color names instead of hex codes
❌ Incomplete JSON (missing closing braces)
❌ Wrapping JSON in markdown code blocks
`;
```

## Data Models

### Action Object Schema

```typescript
type ActionType =
  | 'INSERT_FORMULA'
  | 'EDIT_CELL'
  | 'EDIT_COLUMN'
  | 'EDIT_ROW'
  | 'FIND_REPLACE'
  | 'DATA_CLEANSING'
  | 'DATA_TRANSFORM'
  | 'ADD_COLUMN'
  | 'DELETE_COLUMN'
  | 'DELETE_ROW'
  | 'REMOVE_EMPTY_ROWS'
  | 'SORT_DATA'
  | 'FILTER_DATA'
  | 'REMOVE_DUPLICATES'
  | 'FILL_DOWN'
  | 'SPLIT_COLUMN'
  | 'MERGE_COLUMNS'
  | 'RENAME_COLUMN'
  | 'EXTRACT_NUMBER'
  | 'FORMAT_NUMBER'
  | 'GENERATE_ID'
  | 'CONCATENATE'
  | 'STATISTICS'
  | 'PIVOT_SUMMARY'
  | 'CREATE_CHART'
  | 'CONDITIONAL_FORMAT'
  | 'CLARIFY'
  | 'INFO';

interface BaseAction {
  type: ActionType;
  status?: 'pending' | 'applied' | 'rejected';
  target?: {
    type: 'cell' | 'range' | 'column' | 'row';
    ref: string;
  };
  changes?: DataChange[];
}

interface DataTransformAction extends BaseAction {
  type: 'DATA_TRANSFORM';
  transformType: 'uppercase' | 'lowercase' | 'titlecase';
  target: { type: 'column' | 'range'; ref: string };
}

interface FindReplaceAction extends BaseAction {
  type: 'FIND_REPLACE';
  findValue: string;
  replaceValue: string;
}

interface ConditionalFormatAction extends BaseAction {
  type: 'CONDITIONAL_FORMAT';
  conditionType:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'contains'
    | 'not_contains'
    | 'empty'
    | 'not_empty';
  conditionValues: (string | number)[];
  formatStyle: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: 'normal' | 'bold';
  };
  target: { type: 'column' | 'range'; ref: string };
}

interface SortDataAction extends BaseAction {
  type: 'SORT_DATA';
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

interface FilterDataAction extends BaseAction {
  type: 'FILTER_DATA';
  filterOperator:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'contains'
    | 'not_contains'
    | 'empty'
    | 'not_empty';
  filterValue: string | number;
  target: { type: 'column'; ref: string };
}

type ActionObject =
  | DataTransformAction
  | FindReplaceAction
  | ConditionalFormatAction
  | SortDataAction
  | FilterDataAction
  | BaseAction;
```

### Validation Result Schema

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  missingParams?: string[];
  warnings?: string[];
}
```

### Stream Event Schema

```typescript
interface StreamEvent {
  type: 'delta' | 'done' | 'error';
  content?: string;
  error?: {
    message: string;
    status?: number;
    recoverable: boolean;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Parsing Properties

Property 1: Valid JSON parsing preserves structure
_For any_ valid JSON string representing an AIResponse, parsing should return an equivalent object with the same structure and values
**Validates: Requirements 1.1**

Property 2: JSON extraction from commented text
_For any_ valid JSON object with arbitrary text before or after it, the parser should extract the JSON and return an equivalent parsed object
**Validates: Requirements 1.2**

Property 3: Malformed JSON returns fallback
_For any_ malformed or incomplete JSON string, the parser should not crash and should return a fallback object with type INFO
**Validates: Requirements 1.3, 1.4**

Property 4: Array response extraction
_For any_ JSON array containing AIResponse objects, the parser should extract and return the first element
**Validates: Requirements 1.5**

### UI Rendering Properties

Property 5: Long text wrapping
_For any_ text content longer than the chat bubble width, the text should wrap without horizontal overflow or clipping
**Validates: Requirements 3.1**

Property 6: Markdown rendering completeness
_For any_ valid markdown content, all markdown elements (bold, italic, lists, code blocks) should be rendered without truncation
**Validates: Requirements 3.2**

Property 7: Responsive bubble width
_For any_ viewport width, the chat bubble max-width should adjust to maintain readability (between 60% and 90% of container width)
**Validates: Requirements 3.5**

### Command Execution Properties

Property 8: Text transformation correctness
_For any_ DATA_TRANSFORM action with valid transformType and target data, applying the action should transform all targeted cells according to the transformType
**Validates: Requirements 4.1**

Property 9: Conditional formatting application
_For any_ CONDITIONAL_FORMAT action with valid parameters, applying the action should apply formatStyle to all cells matching the condition
**Validates: Requirements 4.2**

Property 10: Find and replace completeness
_For any_ FIND_REPLACE action with findValue and replaceValue, applying the action should replace all occurrences of findValue with replaceValue in the targeted range
**Validates: Requirements 4.3**

Property 11: Filter data correctness
_For any_ FILTER_DATA action with filterOperator and filterValue, applying the action should keep only rows where the target column satisfies the filter condition
**Validates: Requirements 4.4**

Property 12: Sort data correctness
_For any_ SORT_DATA action with sortColumn and sortDirection, applying the action should reorder rows such that the sortColumn values are in the specified order
**Validates: Requirements 4.5**

Property 13: Execution error reporting
_For any_ action that fails during execution, the error message should contain information about what went wrong
**Validates: Requirements 4.6**

### Validation Properties

Property 14: Required parameter validation
_For any_ action type with defined required parameters, validation should reject actions missing any required parameter and report which parameters are missing
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 15: Action target structure validation
_For any_ action object containing a target field, the target should have both "type" and "ref" fields
**Validates: Requirements 8.4**

Property 16: Changes preview structure validation
_For any_ action object containing a changes field, each change should have cellRef, before, after, and type fields
**Validates: Requirements 8.5**

Property 17: Action type field presence
_For any_ action object generated by AI, it should contain a "type" field with a valid action type value
**Validates: Requirements 8.3**

### Error Handling Properties

Property 18: Parse error notification
_For any_ parsing failure, a toast notification should be displayed with a message explaining the parsing issue
**Validates: Requirements 6.1**

Property 19: Validation error specificity
_For any_ validation failure, the error message should mention the specific parameter(s) that are missing or invalid
**Validates: Requirements 6.2**

Property 20: Unexpected error logging
_For any_ unexpected error during execution, the error should be logged to console with full context including timestamp, error message, and operation context
**Validates: Requirements 6.5**

### Stream Handling Properties

Property 21: Stream chunk accumulation
_For any_ sequence of stream chunks forming a complete response, the accumulated text should equal the concatenation of all chunk contents in order
**Validates: Requirements 7.1**

Property 22: Incomplete JSON buffering
_For any_ stream chunk containing incomplete JSON, the parser should buffer the chunk and wait for subsequent chunks before attempting to parse
**Validates: Requirements 7.2**

Property 23: Multi-line SSE processing
_For any_ stream buffer containing multiple SSE event lines, each line should be processed separately and in order
**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **Parsing Errors**
   - Invalid JSON syntax
   - Missing required fields
   - Type mismatches
   - Unexpected response format

2. **Validation Errors**
   - Missing required parameters
   - Invalid parameter values
   - Invalid target references
   - Type constraints violations

3. **Execution Errors**
   - Target cell/range not found
   - Data type incompatibility
   - Formula syntax errors
   - Permission/access errors

4. **Network Errors**
   - Connection timeout
   - Stream interruption
   - API rate limiting (429)
   - Service unavailable (503)
   - Credit exhausted (402)

### Error Handling Strategy

```typescript
interface ErrorContext {
  operation: string;
  timestamp: Date;
  userAction?: string;
  excelContext?: {
    fileName: string;
    selectedCells: string[];
  };
}

interface ErrorResponse {
  title: string;
  message: string;
  action?: string;
  recoverable: boolean;
  context: ErrorContext;
}

function handleError(error: Error, context: ErrorContext): ErrorResponse {
  // Classify error
  const errorType = classifyError(error);

  // Map to user-friendly message
  const response = mapErrorToResponse(errorType, error, context);

  // Log for debugging
  console.error("Error occurred:", {
    type: errorType,
    message: error.message,
    stack: error.stack,
    context
  });

  // Show toast notification
  toast({
    title: response.title,
    description: response.message,
    variant: response.recoverable ? "default" : "destructive",
    action: response.action ? (
      <Button onClick={() => retryOperation(context)}>
        {response.action}
      </Button>
    ) : undefined
  });

  return response;
}
```

### Error Messages

```typescript
const ERROR_MESSAGES = {
  PARSE_FAILED: {
    title: 'Gagal Memproses Respons',
    message: 'AI mengirim respons yang tidak dapat diproses. Silakan coba lagi.',
    recoverable: true,
    action: 'Coba Lagi',
  },
  VALIDATION_FAILED: {
    title: 'Parameter Tidak Lengkap',
    message: (params: string[]) =>
      `Perintah memerlukan parameter: ${params.join(', ')}. Silakan lengkapi perintah Anda.`,
    recoverable: true,
  },
  EXECUTION_FAILED: {
    title: 'Gagal Menerapkan Perintah',
    message: (reason: string) =>
      `Tidak dapat menerapkan perintah: ${reason}. Periksa data dan coba lagi.`,
    recoverable: true,
    action: 'Coba Lagi',
  },
  NETWORK_ERROR: {
    title: 'Koneksi Terputus',
    message: 'Koneksi ke server terputus. Periksa koneksi internet Anda.',
    recoverable: true,
    action: 'Coba Lagi',
  },
  RATE_LIMIT: {
    title: 'Terlalu Banyak Permintaan',
    message: 'Anda telah mencapai batas permintaan. Silakan tunggu sebentar.',
    recoverable: true,
  },
  CREDIT_EXHAUSTED: {
    title: 'Kredit Habis',
    message: 'Kredit AI Anda telah habis. Silakan isi ulang di Settings.',
    recoverable: false,
  },
  SERVICE_UNAVAILABLE: {
    title: 'Layanan Tidak Tersedia',
    message: 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.',
    recoverable: true,
    action: 'Coba Lagi',
  },
};
```

## Testing Strategy

### Dual Testing Approach

Fitur ini akan menggunakan kombinasi unit tests dan property-based tests untuk memastikan correctness dan robustness:

**Unit Tests** - Untuk kasus spesifik dan edge cases:

- Parsing respons dengan format khusus (array, nested objects)
- Validasi parameter untuk setiap action type
- Error handling untuk status codes spesifik (429, 402, 503)
- UI rendering untuk code blocks dan preview containers
- Stream completion dengan marker [DONE]
- Stream interruption scenarios

**Property-Based Tests** - Untuk universal properties:

- Parsing preserves structure untuk semua valid JSON
- Text wrapping untuk semua panjang teks
- Command execution correctness untuk semua action types
- Validation rejection untuk semua missing parameters
- Error logging untuk semua unexpected errors
- Stream accumulation untuk semua chunk sequences

### Property Test Configuration

Menggunakan **fast-check** library untuk TypeScript property-based testing:

```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
const PROPERTY_TEST_CONFIG = {
  numRuns: 100,
  verbose: true,
};

// Example property test
describe('JSON Parser Properties', () => {
  it('Property 1: Valid JSON parsing preserves structure', () => {
    // Feature: chat-excel-command-improvement, Property 1: Valid JSON parsing preserves structure
    fc.assert(
      fc.property(
        fc.record({
          content: fc.string(),
          action: fc.record({
            type: fc.constantFrom('INFO', 'CLARIFY', 'DATA_TRANSFORM'),
            target: fc.option(
              fc.record({
                type: fc.constantFrom('cell', 'range', 'column', 'row'),
                ref: fc.string(),
              })
            ),
          }),
          quickOptions: fc.array(
            fc.record({
              id: fc.string(),
              label: fc.string(),
              value: fc.string(),
            })
          ),
        }),
        (aiResponse) => {
          const jsonString = JSON.stringify(aiResponse);
          const parseResult = robustJsonParse(jsonString, {});

          expect(parseResult.success).toBe(true);
          expect(parseResult.data).toEqual(aiResponse);
          expect(parseResult.parseMethod).toBe('direct');
        }
      ),
      PROPERTY_TEST_CONFIG
    );
  });
});
```

### Test Coverage Requirements

- **Parser**: 100% coverage untuk semua parsing strategies
- **Validator**: 100% coverage untuk semua action types
- **Command Executor**: >90% coverage untuk semua action implementations
- **Stream Handler**: >90% coverage untuk stream processing logic
- **Error Handler**: 100% coverage untuk semua error types

### Integration Testing

Selain unit dan property tests, perlu integration tests untuk:

- End-to-end flow: user input → stream → parse → validate → execute
- UI rendering dengan berbagai jenis konten (markdown, code, previews)
- Error recovery scenarios (retry after network error)
- Multi-step command sequences (sort then filter then format)

## Implementation Notes

### Performance Considerations

1. **Parsing Performance**
   - Direct JSON.parse() adalah fastest path
   - Fallback strategies hanya digunakan saat direct parse gagal
   - Regex extraction di-cache untuk pattern yang sama

2. **Stream Processing**
   - Buffer management untuk menghindari memory leaks
   - Incremental rendering untuk responsiveness
   - Debounce UI updates untuk mengurangi re-renders

3. **Validation Performance**
   - Validation rules di-cache per action type
   - Early return untuk missing required params
   - Lazy validation untuk optional params

### Security Considerations

1. **Input Sanitization**
   - Sanitize user input sebelum dikirim ke AI
   - Escape special characters dalam formula
   - Validate cell references untuk mencegah injection

2. **Error Message Safety**
   - Jangan expose internal error details ke user
   - Sanitize error messages dari AI
   - Log sensitive info hanya ke console, tidak ke UI

### Accessibility

1. **Screen Reader Support**
   - ARIA labels untuk chat bubbles
   - Announce new messages dengan aria-live
   - Keyboard navigation untuk quick action buttons

2. **Visual Accessibility**
   - High contrast untuk code blocks
   - Sufficient color contrast untuk formatted cells
   - Focus indicators untuk interactive elements

### Browser Compatibility

- Target: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Polyfills: Tidak diperlukan (menggunakan modern JS features yang sudah widely supported)
- Testing: Manual testing di Chrome, Firefox, Safari
