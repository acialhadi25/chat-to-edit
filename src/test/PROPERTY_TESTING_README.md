# Property-Based Testing Infrastructure

This document explains the property-based testing infrastructure set up for the chat-excel-command-improvement feature.

## Overview

Property-based testing is a testing approach where you define properties (invariants) that should hold true for all inputs, and the testing framework generates hundreds of random test cases to verify these properties. This is more powerful than traditional example-based testing because it can discover edge cases you might not think of.

## Setup

### Dependencies

- **fast-check**: Property-based testing library (v4.5.3)
- **vitest**: Test runner with 30-second timeout for property tests
- **@testing-library/react**: For testing React components

### Configuration

The test configuration is defined in:

- `vitest.config.ts`: Main test configuration with 30-second timeout
- `src/test/utils/propertyTestConfig.ts`: Property test configurations

## Test Utilities

### 1. Property Test Configuration (`propertyTestConfig.ts`)

Provides three configuration presets:

- **PROPERTY_TEST_CONFIG**: Standard configuration with 100 iterations (minimum requirement)
- **EXTENDED_PROPERTY_TEST_CONFIG**: Extended configuration with 500 iterations for critical functionality
- **QUICK_PROPERTY_TEST_CONFIG**: Quick configuration with 20 iterations for development/debugging

Usage:

```typescript
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';

fc.assert(fc.property(arbitrary, predicate), PROPERTY_TEST_CONFIG);
```

### 2. Test Data Generators (`generators.ts`)

Provides fast-check arbitraries (generators) for creating random test data:

#### Action Types

- `actionTypeArb`: Generates random action types
- `dataTransformActionArb`: Generates DATA_TRANSFORM actions
- `findReplaceActionArb`: Generates FIND_REPLACE actions
- `conditionalFormatActionArb`: Generates CONDITIONAL_FORMAT actions
- `sortDataActionArb`: Generates SORT_DATA actions
- `filterDataActionArb`: Generates FILTER_DATA actions
- `actionObjectArb`: Generates any valid action object

#### Cell References

- `columnRefArb`: Generates column references (A-Z, AA-ZZ)
- `rowRefArb`: Generates row references (1-1000)
- `cellRefArb`: Generates cell references (A1, B5, AA100)
- `rangeRefArb`: Generates range references (A1:B10)
- `targetArb`: Generates target objects

#### Other Generators

- `aiResponseArb`: Generates AI response objects
- `validJsonArb`: Generates valid JSON strings
- `jsonWithCommentsArb`: Generates JSON with comments
- `malformedJsonArb`: Generates malformed JSON strings
- `jsonArrayArb`: Generates JSON arrays
- `spreadsheetDataArb`: Generates spreadsheet data (2D arrays)
- `errorArb`: Generates error objects

Usage:

```typescript
import { dataTransformActionArb } from './utils/generators';

fc.assert(
  fc.property(dataTransformActionArb, (action) => {
    // Test property with generated action
  }),
  PROPERTY_TEST_CONFIG
);
```

### 3. Property Test Helpers (`propertyTestHelpers.ts`)

Provides helper functions for common assertions:

#### JSON Assertions

- `assertValidJson(value)`: Assert valid JSON string
- `assertDeepEqual(actual, expected)`: Assert deep equality

#### Structure Assertions

- `assertHasProperties(obj, properties)`: Assert object has properties
- `assertValidActionObject(action)`: Assert valid action object structure
- `assertValidTarget(target)`: Assert valid target structure
- `assertValidChanges(changes)`: Assert valid changes array structure

#### String Assertions

- `assertContains(haystack, needle)`: Assert string contains substring
- `assertMatches(value, pattern)`: Assert string matches regex
- `assertValidHexColor(color)`: Assert valid hex color code
- `assertValidCellRef(ref)`: Assert valid cell reference
- `assertValidRangeRef(ref)`: Assert valid range reference
- `assertValidColumnRef(ref)`: Assert valid column reference

#### Array Assertions

- `assertArrayContains(array, element)`: Assert array contains element
- `assertArrayLength(array, length)`: Assert array length

#### Other Assertions

- `assertDefined(value)`: Assert value is defined
- `assertTruthy(value)`: Assert value is truthy
- `assertFalsy(value)`: Assert value is falsy
- `assertOneOf(value, allowedValues)`: Assert value is one of allowed values
- `assertInRange(value, min, max)`: Assert value is in range

Usage:

```typescript
import { assertValidActionObject, assertHasProperties } from './utils/propertyTestHelpers';

fc.assert(
  fc.property(actionObjectArb, (action) => {
    assertValidActionObject(action);
    assertHasProperties(action, ['type']);
  }),
  PROPERTY_TEST_CONFIG
);
```

## Writing Property Tests

### Basic Structure

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';
import { actionObjectArb } from './utils/generators';
import { assertValidActionObject } from './utils/propertyTestHelpers';

describe('Feature Name', () => {
  describe('Property Tests', () => {
    it('Property: Description of the property', () => {
      // **Validates: Requirements X.Y**
      fc.assert(
        fc.property(actionObjectArb, (action) => {
          // Test the property
          assertValidActionObject(action);

          // Return true or use assertions
          return true;
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });
});
```

### Best Practices

1. **Use Descriptive Names**: Name your property tests clearly to describe what property is being tested
2. **Link to Requirements**: Always include a comment linking to the requirement being validated
3. **Use Generators**: Use the provided generators instead of creating your own
4. **Use Helpers**: Use the provided assertion helpers for consistency
5. **Keep Properties Simple**: Each property test should test one invariant
6. **Use Appropriate Config**: Use PROPERTY_TEST_CONFIG (100 iterations) by default, EXTENDED_PROPERTY_TEST_CONFIG for critical functionality

### Example Property Tests

See `src/test/propertyTest.example.test.ts` for complete examples.

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Property Tests Only

```bash
npm test -- src/test/propertyTest.example.test.ts
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run with Coverage

```bash
npm test -- --coverage
```

## Property Test Patterns

### Pattern 1: Roundtrip Property

Test that encoding and decoding are inverse operations:

```typescript
fc.property(dataArb, (data) => {
  const encoded = encode(data);
  const decoded = decode(encoded);
  assertDeepEqual(decoded, data);
});
```

### Pattern 2: Invariant Property

Test that a property always holds:

```typescript
fc.property(actionObjectArb, (action) => {
  assertValidActionObject(action);
  expect(action.type).toBeDefined();
});
```

### Pattern 3: Idempotence Property

Test that applying an operation twice gives the same result:

```typescript
fc.property(dataArb, (data) => {
  const once = transform(data);
  const twice = transform(once);
  assertDeepEqual(once, twice);
});
```

### Pattern 4: Error Handling Property

Test that errors are handled gracefully:

```typescript
fc.property(malformedJsonArb, (json) => {
  const result = parseJson(json);
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

## Troubleshooting

### Test Timeout

If property tests timeout, increase the timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 60000, // 60 seconds
}
```

### Shrinking

When a property test fails, fast-check will try to find the smallest failing example. This is called "shrinking". The shrunk example will be displayed in the test output.

### Reproducibility

If a property test fails, fast-check will display a seed value. You can use this seed to reproduce the failure:

```typescript
fc.assert(fc.property(arbitrary, predicate), { ...PROPERTY_TEST_CONFIG, seed: 1234567890 });
```

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
- [Vitest Documentation](https://vitest.dev/)

## Requirements Validation

This testing infrastructure validates the following requirements:

- **Requirement 9.1**: AI_Response_Parser has unit tests for all parsing strategies
- **Requirement 9.2**: Command_Executor has unit tests for each action type
- **Requirement 9.3**: Stream_Handler has unit tests for streaming scenarios
- **Requirement 9.4**: Error_Handler has unit tests for error types

The property-based testing approach ensures comprehensive coverage by testing universal properties across all possible inputs, complementing traditional unit tests that focus on specific examples.
