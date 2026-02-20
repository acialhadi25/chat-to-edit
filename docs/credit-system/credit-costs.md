# Credit System - Cost Breakdown

## Overview
The credit system tracks usage for all AI operations. Different operations have different credit costs based on their complexity.

## Credit Costs

### AI Chat Operations
- **AI Chat / Info / Clarify**: 1 credit
  - Simple questions and answers
  - Information requests
  - Clarification requests

### Simple Operations (1 credit each)
- **EDIT_CELL**: Edit specific cell values
- **EDIT_COLUMN**: Edit entire column
- **EDIT_ROW**: Edit specific row
- **FIND_REPLACE**: Find and replace text
- **DATA_CLEANSING**: Clean data (trim whitespace, etc.)
- **DATA_TRANSFORM**: Transform data (uppercase/lowercase/titlecase)
- **ADD_COLUMN**: Add new empty column
- **DELETE_COLUMN**: Delete column
- **DELETE_ROW**: Delete specific rows
- **REMOVE_EMPTY_ROWS**: Remove empty rows
- **SORT_DATA**: Sort data
- **FILTER_DATA**: Filter rows
- **REMOVE_DUPLICATES**: Remove duplicates
- **FILL_DOWN**: Fill empty cells
- **RENAME_COLUMN**: Rename column
- **DATA_AUDIT**: Audit data quality

### Complex Operations (2 credits each)
- **INSERT_FORMULA**: Insert formula into cells
- **GENERATE_DATA**: Generate data based on patterns
- **ADD_COLUMN_WITH_DATA**: Add columns with pattern-based data
- **PIVOT_SUMMARY**: Group and summarize data
- **SPLIT_COLUMN**: Split column by delimiter
- **MERGE_COLUMNS**: Merge multiple columns
- **CONDITIONAL_FORMAT**: Apply conditional formatting
- **CREATE_CHART**: Create visual charts

### Special Operations
- **TEMPLATE_GENERATION**: 3 credits
  - Generate complete Excel templates
- **FILE_UPLOAD**: 5 credits
  - Upload and process Excel files

## How Credits are Tracked

1. **Initial Check**: When you send a message, the system checks if you have at least 1 credit available
2. **Action Detection**: After AI responds, the system detects what action type was performed
3. **Credit Deduction**: Credits are deducted based on the actual action type
4. **Async Tracking**: Credit tracking happens asynchronously and doesn't block your workflow

## Examples

### Example 1: Simple Edit (1 credit)
```
User: "Change cell A1 to 'Hello'"
AI Action: EDIT_CELL
Cost: 1 credit
```

### Example 2: Formula Insertion (2 credits)
```
User: "Fill column F with formula Harga * Qty"
AI Action: INSERT_FORMULA
Cost: 2 credits
```

### Example 3: Data Audit (1 credit)
```
User: "Run data quality audit"
AI Action: DATA_AUDIT
Cost: 1 credit
```

### Example 4: Generate Data (2 credits)
```
User: "Generate 100 rows of sample data"
AI Action: GENERATE_DATA
Cost: 2 credits
```

## Checking Your Credits

You can check your remaining credits:
1. In the Subscription page
2. In the user profile dropdown
3. When you receive an "insufficient credits" error

## Insufficient Credits

If you don't have enough credits:
- You'll receive a 402 (Payment Required) error
- The error message will show:
  - Credits remaining
  - Credits limit
  - Credits used
- You'll need to upgrade your plan or wait for the next billing cycle

## Tips to Optimize Credit Usage

1. **Combine Operations**: Instead of multiple small edits, describe what you want in one message
2. **Use Simple Operations**: When possible, use simple operations instead of complex ones
3. **Batch Processing**: Process multiple rows/columns in one operation
4. **Plan Ahead**: Think about what you need before asking AI

## Credit Limits by Plan

- **Free Tier**: 50 credits/month
- **Pro Tier**: 500 credits/month
- **Enterprise Tier**: Unlimited credits

## Questions?

If you have questions about the credit system, please contact support or check the FAQ.
