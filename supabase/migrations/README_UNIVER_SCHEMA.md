# Univer Workbooks Database Schema

## Overview

This migration creates the database schema for the Univer spreadsheet integration, including tables for workbooks, version history, and AI interactions.

## Migration Files

- **20260220000004_create_univer_workbooks_schema.sql** - Main migration file
- **20260220000004_create_univer_workbooks_schema_rollback.sql** - Rollback migration

## Tables Created

### 1. `workbooks`

Stores the main workbook data including all sheets, cells, and formatting.

**Columns:**
- `id` (UUID, PK) - Unique workbook identifier
- `user_id` (UUID, FK) - References auth.users(id)
- `name` (TEXT) - Workbook name
- `data` (JSONB) - Complete workbook data (sheets, cells, formulas, formatting)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Constraints:**
- Name cannot be empty
- Data must be a valid JSON object
- Cascading delete when user is deleted

**Indexes:**
- `idx_workbooks_user_id` - Query by user
- `idx_workbooks_updated_at` - Query by update time
- `idx_workbooks_user_updated` - Composite index for user + update time

### 2. `workbook_history`

Stores version snapshots of workbooks for history tracking and restore functionality.

**Columns:**
- `id` (UUID, PK) - Unique history entry identifier
- `workbook_id` (UUID, FK) - References workbooks(id)
- `user_id` (UUID, FK) - References auth.users(id)
- `snapshot` (JSONB) - Complete workbook snapshot
- `description` (TEXT) - Optional description of the version
- `created_at` (TIMESTAMP) - Version creation timestamp

**Constraints:**
- Snapshot must be a valid JSON object
- Cascading delete when workbook or user is deleted

**Indexes:**
- `idx_workbook_history_workbook_id` - Query by workbook
- `idx_workbook_history_created_at` - Query by creation time
- `idx_workbook_history_workbook_created` - Composite index for workbook + creation time

### 3. `ai_spreadsheet_interactions`

Logs all AI interactions with spreadsheets for analytics, debugging, and audit purposes.

**Columns:**
- `id` (UUID, PK) - Unique interaction identifier
- `workbook_id` (UUID, FK) - References workbooks(id)
- `user_id` (UUID, FK) - References auth.users(id)
- `command` (TEXT) - Natural language command from user
- `intent` (TEXT) - Parsed intent of the command
- `parameters` (JSONB) - Extracted parameters from the command
- `result` (JSONB) - Result of the AI operation
- `success` (BOOLEAN) - Whether the operation succeeded
- `error` (TEXT) - Error message if operation failed
- `execution_time` (INTEGER) - Time taken in milliseconds
- `created_at` (TIMESTAMP) - Interaction timestamp

**Constraints:**
- Command cannot be empty
- Execution time must be positive or null
- Cascading delete when workbook or user is deleted

**Indexes:**
- `idx_ai_interactions_workbook_id` - Query by workbook
- `idx_ai_interactions_user_id` - Query by user
- `idx_ai_interactions_created_at` - Query by creation time
- `idx_ai_interactions_success` - Query by success status
- `idx_ai_interactions_workbook_created` - Composite index for workbook + creation time

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Workbooks Policies
- Users can SELECT their own workbooks
- Users can INSERT their own workbooks
- Users can UPDATE their own workbooks
- Users can DELETE their own workbooks

### Workbook History Policies
- Users can SELECT their own workbook history
- Users can INSERT their own workbook history
- Users can DELETE their own workbook history

### AI Interactions Policies
- Users can SELECT their own AI interactions
- Users can INSERT their own AI interactions
- Users can DELETE their own AI interactions

## Triggers

### `trigger_update_workbooks_updated_at`

Automatically updates the `updated_at` timestamp on the `workbooks` table whenever a row is updated.

## Running the Migration

### Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply specific migration
supabase migration up
```

### Rollback Migration

```bash
# Apply the rollback file
psql -f supabase/migrations/20260220000004_create_univer_workbooks_schema_rollback.sql
```

## Data Model Example

### Workbook Data Structure

```json
{
  "id": "workbook-123",
  "name": "My Spreadsheet",
  "sheets": {
    "sheet-1": {
      "id": "sheet-1",
      "name": "Sheet1",
      "cellData": {
        "0": {
          "0": {
            "v": "Hello",
            "t": 1
          },
          "1": {
            "v": 100,
            "t": 2
          }
        },
        "1": {
          "0": {
            "f": "=SUM(A1:A10)",
            "t": 2
          }
        }
      }
    }
  }
}
```

### AI Interaction Example

```json
{
  "command": "Calculate sum of column A",
  "intent": "set_formula",
  "parameters": {
    "range": "A1:A10",
    "formula": "=SUM(A1:A10)",
    "targetCell": "A11"
  },
  "result": {
    "success": true,
    "value": 550
  },
  "success": true,
  "execution_time": 125
}
```

## Requirements Validation

This schema satisfies the following requirements from the design document:

- **3.2.1** - Auto-save functionality (workbooks table with updated_at)
- **3.2.2** - Save to Supabase database (workbooks table)
- **3.2.3** - Load from Supabase database (workbooks table with RLS)
- **3.2.4** - Version history tracking (workbook_history table)

## Performance Considerations

1. **JSONB Indexing**: Consider adding GIN indexes on JSONB columns for specific query patterns:
   ```sql
   CREATE INDEX idx_workbooks_data_gin ON workbooks USING GIN (data);
   ```

2. **Partitioning**: For high-volume AI interactions, consider partitioning by date:
   ```sql
   -- Example: Partition by month
   CREATE TABLE ai_spreadsheet_interactions_2024_01 
   PARTITION OF ai_spreadsheet_interactions
   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
   ```

3. **Archiving**: Implement archiving strategy for old workbook history and AI interactions to maintain performance.

## Security Notes

1. All tables use RLS to ensure users can only access their own data
2. Foreign key constraints ensure referential integrity
3. Cascading deletes ensure cleanup when users or workbooks are deleted
4. Check constraints validate data integrity (non-empty names, positive execution times)

## Monitoring Queries

### Check workbook count per user
```sql
SELECT user_id, COUNT(*) as workbook_count
FROM workbooks
GROUP BY user_id
ORDER BY workbook_count DESC;
```

### Check AI interaction success rate
```sql
SELECT 
  success,
  COUNT(*) as count,
  ROUND(AVG(execution_time), 2) as avg_execution_time_ms
FROM ai_spreadsheet_interactions
GROUP BY success;
```

### Check workbook history size
```sql
SELECT 
  workbook_id,
  COUNT(*) as version_count,
  pg_size_pretty(SUM(pg_column_size(snapshot))) as total_size
FROM workbook_history
GROUP BY workbook_id
ORDER BY SUM(pg_column_size(snapshot)) DESC
LIMIT 10;
```

## Related Documentation

- [Requirements Document](../../../.kiro/specs/univer-integration/requirements.md)
- [Design Document](../../../.kiro/specs/univer-integration/design.md)
- [Tasks Document](../../../.kiro/specs/univer-integration/tasks.md)
