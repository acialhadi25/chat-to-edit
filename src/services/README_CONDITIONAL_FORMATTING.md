# Conditional Formatting Service

Comprehensive conditional formatting service for Univer Sheet integration that provides rule-based cell formatting capabilities.

## Overview

The Conditional Formatting Service enables automatic cell formatting based on conditions, helping users visualize data patterns, trends, and outliers. It supports multiple rule types including highlight rules, data bars, color scales, and icon sets.

## Features

### 1. Highlight Rules
Apply formatting (colors, fonts) when cells meet specific conditions:
- **Cell State**: Empty or not empty
- **Number Conditions**: Greater than, less than, between values
- **Text Conditions**: Contains, starts with, ends with, equals
- **Formula Conditions**: Custom formula evaluation

### 2. Data Bars
Visual bars within cells representing value magnitude:
- Auto or manual min/max values
- Positive and negative colors
- Gradient or solid fill
- Show/hide cell values

### 3. Color Scales
Gradient coloring based on value ranges:
- 2-color scales (min to max)
- 3-color scales (min to mid to max)
- Custom value thresholds
- Percentile-based coloring

### 4. Icon Sets
Visual indicators (arrows, flags, ratings) based on value ranges:
- 3, 4, or 5 icon sets
- Multiple icon types (arrows, traffic lights, ratings, etc.)
- Reverse icon order option
- Show/hide cell values

### 5. Rule Management
Complete CRUD operations for conditional formatting rules:
- Create, read, update, delete rules
- Reorder rules (change priority)
- Clear rules from ranges or entire worksheet
- Get rules for specific ranges

## Installation

The service is part of the Univer integration and requires the conditional formatting plugin:

```bash
npm install @univerjs/sheets-conditional-formatting @univerjs/sheets-conditional-formatting-ui
```

## Usage

### Basic Setup

```typescript
import { createConditionalFormattingService } from './services/conditionalFormattingService';

// Create service instance
const service = createConditionalFormattingService(univerAPI, isReady);
```

### Creating Highlight Rules

```typescript
// Highlight empty cells in red
await service.createHighlightRule('A1:A10', {
  condition: 'empty',
  backgroundColor: '#FF0000'
});

// Highlight cells greater than 100 in green with bold text
await service.createHighlightRule('B1:B10', {
  condition: 'greaterThan',
  value: 100,
  backgroundColor: '#00FF00',
  fontColor: '#000000',
  bold: true
});

// Highlight cells containing "error" in red
await service.createHighlightRule('C1:C10', {
  condition: 'contains',
  value: 'error',
  backgroundColor: '#FF0000',
  fontColor: '#FFFFFF'
});

// Highlight cells between 10 and 90
await service.createHighlightRule('D1:D10', {
  condition: 'between',
  value: 10,
  value2: 90,
  backgroundColor: '#FFFF00'
});

// Highlight cells based on formula
await service.createHighlightRule('E1:E10', {
  condition: 'formula',
  value: '=E1>AVERAGE($E$1:$E$10)',
  backgroundColor: '#00FFFF'
});
```

### Creating Data Bars

```typescript
// Data bar with auto min/max
await service.createDataBarRule('A1:A10', {
  min: { type: 'autoMin' },
  max: { type: 'autoMax' },
  positiveColor: '#00FF00',
  negativeColor: '#FF0000',
  isShowValue: true,
  isGradient: true
});

// Data bar with specific numeric range
await service.createDataBarRule('B1:B10', {
  min: { type: 'num', value: 0 },
  max: { type: 'num', value: 100 },
  positiveColor: '#0000FF',
  isShowValue: false
});

// Data bar with percentage values
await service.createDataBarRule('C1:C10', {
  min: { type: 'percent', value: 0 },
  max: { type: 'percent', value: 100 },
  positiveColor: '#FFFF00'
});
```

### Creating Color Scales

```typescript
// 2-color scale (red to green)
await service.createColorScaleRule('A1:A10', {
  minColor: '#FF0000',
  maxColor: '#00FF00'
});

// 3-color scale (red to yellow to green)
await service.createColorScaleRule('B1:B10', {
  minColor: '#FF0000',
  midColor: '#FFFF00',
  maxColor: '#00FF00'
});

// Color scale with custom values
await service.createColorScaleRule('C1:C10', {
  minColor: '#0000FF',
  maxColor: '#FF0000',
  minValue: { type: 'num', value: 0 },
  maxValue: { type: 'num', value: 100 }
});
```

### Creating Icon Sets

```typescript
// 3-arrow icon set
await service.createIconSetRule('A1:A10', {
  iconType: '3Arrows',
  isShowValue: true
});

// 5-rating icon set with reversed order
await service.createIconSetRule('B1:B10', {
  iconType: '5Rating',
  reverseIconOrder: true,
  isShowValue: false
});

// Traffic lights icon set
await service.createIconSetRule('C1:C10', {
  iconType: '3TrafficLights',
  isShowValue: true
});
```

### Managing Rules

```typescript
// Get all rules for a range
const rules = await service.getRules('A1:A10');
console.log(`Found ${rules.length} rules`);

// Get all rules for the worksheet
const allRules = await service.getAllRules();

// Update a rule
const updatedRule = {
  ...rules[0],
  ranges: [{ startRow: 0, endRow: 19, startColumn: 0, endColumn: 0 }]
};
await service.updateRule(rules[0].cfId, updatedRule);

// Move a rule (change priority)
await service.moveRule(rules[2].cfId, rules[0].cfId, 'before');

// Delete a rule
await service.deleteRule(rules[0].cfId);

// Clear rules from a range
await service.clearRules('A1:A10');

// Clear all rules from worksheet
await service.clearAllRules();
```

## API Reference

### ConditionalFormattingService

#### Constructor
```typescript
constructor(univerAPI: FUniver | null, isReady: boolean)
```

#### Methods

##### createHighlightRule
```typescript
async createHighlightRule(
  range: string,
  options: HighlightRuleOptions
): Promise<string>
```
Creates a highlight rule that applies formatting when conditions are met.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:B10")
- `options`: Highlight rule configuration
  - `condition`: 'empty' | 'notEmpty' | 'greaterThan' | 'lessThan' | 'between' | 'contains' | 'formula'
  - `value?`: Condition value (number or string)
  - `value2?`: Second value for 'between' condition
  - `backgroundColor?`: Hex color (e.g., "#FF0000")
  - `fontColor?`: Hex color
  - `bold?`: Boolean
  - `italic?`: Boolean

**Returns:** Rule ID

##### createDataBarRule
```typescript
async createDataBarRule(
  range: string,
  options: DataBarOptions
): Promise<string>
```
Creates a data bar rule that displays visual bars in cells.

**Parameters:**
- `range`: A1 notation range
- `options`: Data bar configuration
  - `min`: Value configuration for minimum
  - `max`: Value configuration for maximum
  - `positiveColor`: Hex color for positive values
  - `negativeColor?`: Hex color for negative values
  - `isGradient?`: Boolean (default: false)
  - `isShowValue?`: Boolean (default: true)

**Returns:** Rule ID

##### createColorScaleRule
```typescript
async createColorScaleRule(
  range: string,
  options: ColorScaleOptions
): Promise<string>
```
Creates a color scale rule that applies gradient coloring.

**Parameters:**
- `range`: A1 notation range
- `options`: Color scale configuration
  - `minColor`: Hex color for minimum value
  - `maxColor`: Hex color for maximum value
  - `midColor?`: Hex color for middle value (3-color scale)
  - `minValue?`: Value configuration for minimum
  - `midValue?`: Value configuration for middle
  - `maxValue?`: Value configuration for maximum

**Returns:** Rule ID

##### createIconSetRule
```typescript
async createIconSetRule(
  range: string,
  options: IconSetOptions
): Promise<string>
```
Creates an icon set rule that displays icons based on values.

**Parameters:**
- `range`: A1 notation range
- `options`: Icon set configuration
  - `iconType`: Icon set type (e.g., '3Arrows', '5Rating')
  - `isShowValue?`: Boolean (default: true)
  - `reverseIconOrder?`: Boolean (default: false)

**Returns:** Rule ID

##### getRules
```typescript
async getRules(range: string): Promise<IConditionFormattingRule[]>
```
Gets all conditional formatting rules for a specific range.

##### getAllRules
```typescript
async getAllRules(): Promise<IConditionFormattingRule[]>
```
Gets all conditional formatting rules for the worksheet.

##### deleteRule
```typescript
async deleteRule(cfId: string): Promise<boolean>
```
Deletes a conditional formatting rule by ID.

##### updateRule
```typescript
async updateRule(
  cfId: string,
  rule: Partial<IConditionFormattingRule>
): Promise<boolean>
```
Updates an existing conditional formatting rule.

##### moveRule
```typescript
async moveRule(
  cfId: string,
  targetCfId: string,
  position: 'before' | 'after'
): Promise<boolean>
```
Moves a rule to change its priority relative to another rule.

##### clearRules
```typescript
async clearRules(range: string): Promise<boolean>
```
Clears all conditional formatting rules from a range.

##### clearAllRules
```typescript
async clearAllRules(): Promise<boolean>
```
Clears all conditional formatting rules from the worksheet.

##### updateAPI
```typescript
updateAPI(univerAPI: FUniver | null, isReady: boolean): void
```
Updates the Univer API instance.

## Type Definitions

### HighlightRuleOptions
```typescript
interface HighlightRuleOptions {
  condition: 'empty' | 'notEmpty' | 'greaterThan' | 'lessThan' | 'between' | 'contains' | 'formula';
  value?: number | string;
  value2?: number;
  backgroundColor?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
}
```

### DataBarOptions
```typescript
interface DataBarOptions {
  min: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMin'; value?: number };
  max: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMax'; value?: number };
  positiveColor: string;
  negativeColor?: string;
  isGradient?: boolean;
  isShowValue?: boolean;
}
```

### ColorScaleOptions
```typescript
interface ColorScaleOptions {
  minColor: string;
  midColor?: string;
  maxColor: string;
  minValue?: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMin'; value?: number };
  midValue?: { type: 'num' | 'percent' | 'formula' | 'percentile'; value?: number };
  maxValue?: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMax'; value?: number };
}
```

### IconSetOptions
```typescript
interface IconSetOptions {
  iconType: '3Arrows' | '3ArrowsGray' | '3Flags' | '3TrafficLights' | '3Signs' | '3Symbols' | '3Stars' | '4Arrows' | '4ArrowsGray' | '4Rating' | '4TrafficLights' | '5Arrows' | '5ArrowsGray' | '5Rating' | '5Quarters';
  isShowValue?: boolean;
  reverseIconOrder?: boolean;
}
```

## Error Handling

All methods throw errors for:
- Invalid range notation
- Invalid color format (must be hex: #RRGGBB)
- Missing required values
- Missing Univer API or worksheet
- Invalid rule IDs

Example error handling:
```typescript
try {
  await service.createHighlightRule('A1:A10', {
    condition: 'greaterThan',
    value: 100,
    backgroundColor: '#00FF00'
  });
} catch (error) {
  console.error('Failed to create rule:', error.message);
}
```

## Testing

The service includes comprehensive tests covering:
- All rule types (highlight, data bar, color scale, icon set)
- All conditions and configurations
- Rule management operations
- Error handling scenarios
- Edge cases

Run tests:
```bash
npm test conditionalFormattingService.test.ts
```

## Requirements Mapping

This service implements:
- **Requirement 1.3.5**: Conditional formatting support
- **Requirement 4.2.5**: Advanced conditional formatting features

## Documentation References

- [Univer Conditional Formatting Guide](https://docs.univer.ai/guides/sheets/features/conditional-formatting)
- [FConditionalFormattingBuilder API](https://reference.univer.ai/classes/FConditionalFormattingBuilder)
- [Univer Sheets API](https://docs.univer.ai/guides/sheets/getting-started/sheets-api)

## Notes

- Conditional formatting rules are evaluated in order (priority matters)
- Multiple rules can apply to the same cell
- Rules update automatically when data changes
- Color format must be hex (#RRGGBB)
- Range notation must be A1 format (e.g., "A1:B10")
- Icon sets automatically distribute based on percentiles
- Data bars support both positive and negative values

## Future Enhancements

Potential improvements for future versions:
- Custom icon configurations
- More complex formula conditions
- Rule templates
- Bulk rule operations
- Rule import/export
- Performance optimization for large ranges
