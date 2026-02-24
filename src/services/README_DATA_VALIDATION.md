# Data Validation Service

Comprehensive data validation service for Univer Sheet integration that provides validation rules to ensure data integrity and accuracy.

## Features

- **Number Validation**: Between, equal, greater than, less than
- **Date Validation**: Before, after, between, equal
- **List Validation**: Dropdown lists (predefined or range-based)
- **Checkbox Validation**: Boolean value validation
- **Custom Formula Validation**: Custom validation logic
- **Rule Management**: Get, update, clear validation rules
- **Validation Status**: Check validation status of cells

## Installation

The service is automatically available through the Univer integration. No additional installation required.

## Usage

### Basic Setup

```typescript
import { createDataValidationService } from '@/services/dataValidationService';

// Create service instance
const service = createDataValidationService(univerAPI, true);
```

### Number Validation

#### Require Number Between

```typescript
// Basic usage
await service.requireNumberBetween('A1:A10', 1, 100);

// With options
await service.requireNumberBetween('A1:A10', 1, 100, {
  allowBlank: true,
  showErrorMessage: true,
  error: 'Please enter a number between 1 and 100',
  errorStyle: DataValidationErrorStyle.STOP
});
```

#### Require Number Equal To

```typescript
await service.requireNumberEqualTo('B1:B10', 50, {
  showErrorMessage: true,
  error: 'Value must be exactly 50'
});
```

#### Require Number Greater Than

```typescript
await service.requireNumberGreaterThan('C1:C10', 0, {
  showErrorMessage: true,
  error: 'Value must be positive'
});
```

#### Require Number Less Than

```typescript
await service.requireNumberLessThan('D1:D10', 100, {
  showErrorMessage: true,
  error: 'Value must be less than 100'
});
```

### Date Validation

#### Require Date After

```typescript
const startDate = new Date('2024-01-01');
await service.requireDateAfter('A1:A10', startDate, {
  showErrorMessage: true,
  error: 'Date must be after January 1, 2024'
});
```

#### Require Date Before

```typescript
const endDate = '2024-12-31';
await service.requireDateBefore('B1:B10', endDate, {
  showErrorMessage: true,
  error: 'Date must be before December 31, 2024'
});
```

#### Require Date Between

```typescript
const start = new Date('2024-01-01');
const end = new Date('2024-12-31');
await service.requireDateBetween('C1:C10', start, end, {
  showErrorMessage: true,
  error: 'Date must be in 2024'
});
```

### List Validation

#### Dropdown List (Predefined Values)

```typescript
// Basic dropdown
await service.requireValueInList('A1:A10', ['Active', 'Inactive', 'Pending']);

// With error message
await service.requireValueInList('A1:A10', ['Yes', 'No', 'Maybe'], {
  showErrorMessage: true,
  error: 'Please select a valid option'
});
```

#### Dropdown List (Range-Based)

```typescript
// Use values from another range
await service.requireValueInRange('A1:A10', 'E1:E5', {
  showErrorMessage: true,
  error: 'Please select a value from the list'
});
```

### Other Validation Types

#### Checkbox Validation

```typescript
await service.requireCheckbox('A1:A10', {
  showInputMessage: true,
  prompt: 'Check to mark as complete',
  promptTitle: 'Task Status'
});
```

#### Custom Formula Validation

```typescript
// Require unique values
await service.requireFormulaSatisfied(
  'A2:A10',
  '=COUNTIF($A$2:$A$10,A2)=1',
  {
    showErrorMessage: true,
    error: 'Value must be unique'
  }
);

// Require value greater than another cell
await service.requireFormulaSatisfied(
  'B2:B10',
  '=B2>A2',
  {
    showErrorMessage: true,
    error: 'Value must be greater than column A'
  }
);
```

### Rule Management

#### Get Validation Rule

```typescript
// Get first validation rule for range
const rule = service.getDataValidation('A1:A10');
if (rule) {
  console.log('Type:', rule.getCriteriaType());
  console.log('Values:', rule.getCriteriaValues());
  console.log('Help text:', rule.getHelpText());
}
```

#### Get All Validation Rules

```typescript
// Get all rules for a range
const rulesForRange = service.getDataValidations('A1:A10');
console.log(`Found ${rulesForRange.length} rules`);

// Get all rules for worksheet
const allRules = service.getAllDataValidations();
console.log(`Total rules: ${allRules.length}`);
```

#### Clear Validation

```typescript
// Clear validation from specific range
await service.clearDataValidation('A1:A10');
```

#### Get Validation Status

```typescript
const status = await service.getValidatorStatus('A1:A10');
console.log('Valid cells:', status.validCells);
console.log('Invalid cells:', status.invalidCells);
console.log('Total cells:', status.totalCells);
```

## Validation Options

All validation methods accept an optional `ValidationOptions` parameter:

```typescript
interface ValidationOptions {
  // Allow blank cells
  allowBlank?: boolean;
  
  // Show error message on invalid input
  showErrorMessage?: boolean;
  
  // Error message text
  error?: string;
  
  // Error style (STOP, WARNING, INFO)
  errorStyle?: DataValidationErrorStyle;
  
  // Show input message when cell is selected
  showInputMessage?: boolean;
  
  // Input message text
  prompt?: string;
  
  // Input message title
  promptTitle?: string;
}
```

### Error Styles

```typescript
enum DataValidationErrorStyle {
  STOP = 'stop',        // Prevent invalid input
  WARNING = 'warning',  // Warn but allow invalid input
  INFO = 'info',        // Show info message only
}
```

## Complete Examples

### Example 1: Product Inventory Form

```typescript
// Quantity (positive integer)
await service.requireNumberGreaterThan('B2:B100', 0, {
  allowBlank: false,
  showErrorMessage: true,
  error: 'Quantity must be a positive number',
  errorStyle: DataValidationErrorStyle.STOP
});

// Status (dropdown)
await service.requireValueInList('C2:C100', ['In Stock', 'Out of Stock', 'Discontinued'], {
  showErrorMessage: true,
  error: 'Please select a valid status'
});

// Price (between 0 and 10000)
await service.requireNumberBetween('D2:D100', 0, 10000, {
  allowBlank: false,
  showErrorMessage: true,
  error: 'Price must be between $0 and $10,000',
  errorStyle: DataValidationErrorStyle.STOP
});
```

### Example 2: Employee Data Form

```typescript
// Employee ID (unique)
await service.requireFormulaSatisfied(
  'A2:A100',
  '=COUNTIF($A$2:$A$100,A2)=1',
  {
    showErrorMessage: true,
    error: 'Employee ID must be unique',
    errorStyle: DataValidationErrorStyle.STOP
  }
);

// Department (dropdown from range)
await service.requireValueInRange('C2:C100', 'Departments!A2:A10', {
  showErrorMessage: true,
  error: 'Please select a valid department'
});

// Start Date (after company founding)
await service.requireDateAfter('D2:D100', new Date('2020-01-01'), {
  showErrorMessage: true,
  error: 'Start date must be after company founding (2020-01-01)'
});

// Active Status (checkbox)
await service.requireCheckbox('E2:E100', {
  showInputMessage: true,
  prompt: 'Check if employee is currently active',
  promptTitle: 'Employment Status'
});
```

### Example 3: Survey Form

```typescript
// Age (between 18 and 100)
await service.requireNumberBetween('A2:A1000', 18, 100, {
  allowBlank: false,
  showErrorMessage: true,
  error: 'Age must be between 18 and 100',
  showInputMessage: true,
  prompt: 'Enter your age',
  promptTitle: 'Age'
});

// Rating (1-5 stars)
await service.requireNumberBetween('B2:B1000', 1, 5, {
  allowBlank: false,
  showErrorMessage: true,
  error: 'Rating must be between 1 and 5',
  showInputMessage: true,
  prompt: 'Rate from 1 (poor) to 5 (excellent)',
  promptTitle: 'Rating'
});

// Feedback Category
await service.requireValueInList('C2:C1000', [
  'Product Quality',
  'Customer Service',
  'Pricing',
  'Delivery',
  'Other'
], {
  showErrorMessage: true,
  error: 'Please select a feedback category'
});
```

## Error Handling

All methods throw errors for invalid inputs:

```typescript
try {
  await service.requireNumberBetween('A1:A10', 1, 100);
} catch (error) {
  console.error('Validation error:', error.message);
}
```

Common errors:
- `Range must be a non-empty string`
- `Invalid range notation`
- `No active worksheet available`
- `Values array cannot be empty`
- `Formula must be a non-empty string`

## Best Practices

1. **Use Appropriate Error Styles**
   - `STOP`: For critical validations (IDs, required fields)
   - `WARNING`: For recommendations (suggested ranges)
   - `INFO`: For helpful hints

2. **Provide Clear Error Messages**
   ```typescript
   // Good
   error: 'Age must be between 18 and 100'
   
   // Bad
   error: 'Invalid input'
   ```

3. **Use Input Messages for Guidance**
   ```typescript
   showInputMessage: true,
   prompt: 'Enter a value between 1 and 100',
   promptTitle: 'Score'
   ```

4. **Allow Blanks When Appropriate**
   ```typescript
   // Required field
   allowBlank: false
   
   // Optional field
   allowBlank: true
   ```

5. **Use Range-Based Lists for Dynamic Data**
   ```typescript
   // Better: Updates automatically when source changes
   await service.requireValueInRange('A1:A10', 'Categories!A2:A20');
   
   // Less flexible: Must update validation when list changes
   await service.requireValueInList('A1:A10', ['Cat1', 'Cat2', 'Cat3']);
   ```

## Requirements

- **Requirement 4.2.4**: Data validation rules
- Validates input against rules
- Shows validation errors
- Supports multiple validation types

## API Reference

### Number Validation Methods
- `requireNumberBetween(range, start, end, options?)`
- `requireNumberEqualTo(range, value, options?)`
- `requireNumberGreaterThan(range, value, options?)`
- `requireNumberLessThan(range, value, options?)`

### Date Validation Methods
- `requireDateAfter(range, date, options?)`
- `requireDateBefore(range, date, options?)`
- `requireDateBetween(range, start, end, options?)`

### List Validation Methods
- `requireValueInList(range, values, options?)`
- `requireValueInRange(range, sourceRange, options?)`

### Other Validation Methods
- `requireCheckbox(range, options?)`
- `requireFormulaSatisfied(range, formula, options?)`

### Rule Management Methods
- `getDataValidation(range): FDataValidation | null`
- `getDataValidations(range): FDataValidation[]`
- `getAllDataValidations(): FDataValidation[]`
- `clearDataValidation(range): Promise<boolean>`
- `getValidatorStatus(range): Promise<any>`

## Related Documentation

- [Univer Data Validation Guide](https://docs.univer.ai/zh-CN/guides/sheets/features/data-validation)
- [Sort & Filter Service](./README_SORT_FILTER.md)
- [Conditional Formatting Service](./README_CONDITIONAL_FORMATTING.md)
