/**
 * Test Data Generators for Property-Based Testing
 *
 * This file contains fast-check arbitraries (generators) for creating
 * random test data for the chat-excel-command-improvement feature.
 *
 * Requirements: 9.3, 9.4
 */

import fc from 'fast-check';

/**
 * Action types supported by the system
 */
export const ACTION_TYPES = [
  'INSERT_FORMULA',
  'EDIT_CELL',
  'EDIT_COLUMN',
  'EDIT_ROW',
  'FIND_REPLACE',
  'DATA_CLEANSING',
  'DATA_TRANSFORM',
  'ADD_COLUMN',
  'DELETE_COLUMN',
  'DELETE_ROW',
  'REMOVE_EMPTY_ROWS',
  'SORT_DATA',
  'FILTER_DATA',
  'REMOVE_DUPLICATES',
  'FILL_DOWN',
  'SPLIT_COLUMN',
  'MERGE_COLUMNS',
  'RENAME_COLUMN',
  'EXTRACT_NUMBER',
  'FORMAT_NUMBER',
  'GENERATE_ID',
  'CONCATENATE',
  'STATISTICS',
  'PIVOT_SUMMARY',
  'CREATE_CHART',
  'CONDITIONAL_FORMAT',
  'CLARIFY',
  'INFO',
] as const;

/**
 * Generate a random action type
 */
export const actionTypeArb = fc.constantFrom(...ACTION_TYPES);

/**
 * Generate a random target type
 */
export const targetTypeArb = fc.constantFrom('cell', 'range', 'column', 'row');

/**
 * Generate a random column reference (A-Z, AA-ZZ)
 */
export const columnRefArb = fc.oneof(
  // Single letter columns (A-Z)
  fc.integer({ min: 65, max: 90 }).map((code) => String.fromCharCode(code)),
  // Double letter columns (AA-ZZ)
  fc
    .tuple(fc.integer({ min: 65, max: 90 }), fc.integer({ min: 65, max: 90 }))
    .map(([first, second]) => String.fromCharCode(first) + String.fromCharCode(second))
);

/**
 * Generate a random row reference (1-1000)
 */
export const rowRefArb = fc.integer({ min: 1, max: 1000 });

/**
 * Generate a random cell reference (e.g., A1, B5, AA100)
 */
export const cellRefArb = fc.tuple(columnRefArb, rowRefArb).map(([col, row]) => `${col}${row}`);

/**
 * Generate a random range reference (e.g., A1:B10)
 */
export const rangeRefArb = fc
  .tuple(cellRefArb, cellRefArb)
  .map(([start, end]) => `${start}:${end}`);

/**
 * Generate a random target object
 */
export const targetArb = fc.record({
  type: targetTypeArb,
  ref: fc.oneof(cellRefArb, rangeRefArb, columnRefArb, rowRefArb.map(String)),
});

/**
 * Generate a random transform type
 */
export const transformTypeArb = fc.constantFrom('uppercase', 'lowercase', 'titlecase');

/**
 * Generate a random sort direction
 */
export const sortDirectionArb = fc.constantFrom('asc', 'desc');

/**
 * Generate a random filter operator
 */
export const filterOperatorArb = fc.constantFrom(
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'contains',
  'not_contains',
  'empty',
  'not_empty'
);

/**
 * Generate a random condition type for conditional formatting
 */
export const conditionTypeArb = fc.constantFrom(
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'contains',
  'not_contains',
  'empty',
  'not_empty'
);

/**
 * Generate a random hex color code
 */
export const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });

/**
 * Generate a random format style object
 */
export const formatStyleArb = fc.record({
  color: fc.option(hexColorArb, { nil: undefined }),
  backgroundColor: fc.option(hexColorArb, { nil: undefined }),
  fontWeight: fc.option(fc.constantFrom('normal', 'bold'), { nil: undefined }),
});

/**
 * Generate a random quick option
 */
export const quickOptionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.string({ minLength: 1, maxLength: 100 }),
});

/**
 * Generate a random data change object
 */
export const dataChangeArb = fc.record({
  cellRef: cellRefArb,
  before: fc.oneof(fc.string(), fc.integer(), fc.double(), fc.constant(null)),
  after: fc.oneof(fc.string(), fc.integer(), fc.double(), fc.constant(null)),
  type: fc.constantFrom('value', 'formula'),
});

/**
 * Generate a base action object with common fields
 */
export const baseActionArb = fc.record({
  type: actionTypeArb,
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  target: fc.option(targetArb, { nil: undefined }),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate a DATA_TRANSFORM action object
 */
export const dataTransformActionArb = fc.record({
  type: fc.constant('DATA_TRANSFORM' as const),
  transformType: transformTypeArb,
  target: targetArb,
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate a FIND_REPLACE action object
 */
export const findReplaceActionArb = fc.record({
  type: fc.constant('FIND_REPLACE' as const),
  findValue: fc.string({ minLength: 1, maxLength: 50 }),
  replaceValue: fc.string({ minLength: 0, maxLength: 50 }),
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate a CONDITIONAL_FORMAT action object
 */
export const conditionalFormatActionArb = fc.record({
  type: fc.constant('CONDITIONAL_FORMAT' as const),
  conditionType: conditionTypeArb,
  conditionValues: fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 3 }),
  formatStyle: formatStyleArb,
  target: targetArb,
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate a SORT_DATA action object
 */
export const sortDataActionArb = fc.record({
  type: fc.constant('SORT_DATA' as const),
  sortColumn: columnRefArb,
  sortDirection: sortDirectionArb,
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate a FILTER_DATA action object
 */
export const filterDataActionArb = fc.record({
  type: fc.constant('FILTER_DATA' as const),
  filterOperator: filterOperatorArb,
  filterValue: fc.oneof(fc.string(), fc.integer()),
  target: targetArb,
  status: fc.constantFrom('pending', 'applied', 'rejected'),
  changes: fc.option(fc.array(dataChangeArb, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Generate any valid action object (union of all action types)
 */
export const actionObjectArb = fc.oneof(
  baseActionArb,
  dataTransformActionArb,
  findReplaceActionArb,
  conditionalFormatActionArb,
  sortDataActionArb,
  filterDataActionArb
);

/**
 * Generate an AI response object
 */
export const aiResponseArb = fc.record({
  content: fc.string({ minLength: 1, maxLength: 500 }),
  action: fc.option(actionObjectArb, { nil: undefined }),
  quickOptions: fc.option(fc.array(quickOptionArb, { minLength: 0, maxLength: 5 }), {
    nil: undefined,
  }),
});

/**
 * Generate a valid JSON string containing an AI response
 */
export const validJsonArb = aiResponseArb.map((response) => JSON.stringify(response));

/**
 * Generate a JSON string with extra whitespace and comments
 */
export const jsonWithCommentsArb = aiResponseArb.map((response) => {
  const json = JSON.stringify(response, null, 2);
  const comments = [
    '// This is a comment\n',
    '/* Multi-line comment */\n',
    'Here is the response:\n',
    '\n\nSome explanation text\n\n',
  ];
  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  return randomComment + json;
});

/**
 * Generate a malformed JSON string (various types of errors)
 */
export const malformedJsonArb = fc.oneof(
  // Missing closing brace
  fc.string().map((s) => `{"content": "${s}"`),
  // Invalid escape sequences
  fc.string().map((s) => `{"content": "\\x${s}"}`),
  // Trailing comma
  fc.string().map((s) => `{"content": "${s}",}`),
  // Unquoted keys
  fc.string().map((s) => `{content: "${s}"}`),
  // Single quotes instead of double
  fc.string().map((s) => `{'content': '${s}'}`),
  // Incomplete array
  fc.string().map((s) => `[{"content": "${s}"`)
);

/**
 * Generate a JSON array containing AI responses
 */
export const jsonArrayArb = fc
  .array(aiResponseArb, { minLength: 1, maxLength: 5 })
  .map((responses) => JSON.stringify(responses));

/**
 * Generate random spreadsheet data (2D array)
 */
export const spreadsheetDataArb = fc.array(
  fc.array(
    fc.oneof(
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.integer({ min: -1000, max: 1000 }),
      fc.double({ min: -1000, max: 1000, noNaN: true }),
      fc.constant(null),
      fc.constant('')
    ),
    { minLength: 1, maxLength: 10 }
  ),
  { minLength: 1, maxLength: 100 }
);

/**
 * Generate a random error object
 */
export const errorArb = fc.record({
  message: fc.string({ minLength: 1, maxLength: 200 }),
  status: fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
  code: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});
