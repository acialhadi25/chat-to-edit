-- Rollback Migration: Drop Univer Workbooks Schema
-- Description: Removes all tables, indexes, and policies created for Univer integration
-- Feature: univer-integration

-- ============================================================================
-- Drop Policies
-- ============================================================================

-- Drop workbooks policies
DROP POLICY IF EXISTS "Users can view their own workbooks" ON workbooks;
DROP POLICY IF EXISTS "Users can insert their own workbooks" ON workbooks;
DROP POLICY IF EXISTS "Users can update their own workbooks" ON workbooks;
DROP POLICY IF EXISTS "Users can delete their own workbooks" ON workbooks;

-- Drop workbook_history policies
DROP POLICY IF EXISTS "Users can view their own workbook history" ON workbook_history;
DROP POLICY IF EXISTS "Users can insert their own workbook history" ON workbook_history;
DROP POLICY IF EXISTS "Users can delete their own workbook history" ON workbook_history;

-- Drop ai_spreadsheet_interactions policies
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_spreadsheet_interactions;
DROP POLICY IF EXISTS "Users can insert their own AI interactions" ON ai_spreadsheet_interactions;
DROP POLICY IF EXISTS "Users can delete their own AI interactions" ON ai_spreadsheet_interactions;

-- ============================================================================
-- Drop Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_workbooks_updated_at ON workbooks;
DROP FUNCTION IF EXISTS update_workbooks_updated_at();

-- ============================================================================
-- Drop Tables (in reverse order of dependencies)
-- ============================================================================

DROP TABLE IF EXISTS ai_spreadsheet_interactions CASCADE;
DROP TABLE IF EXISTS workbook_history CASCADE;
DROP TABLE IF EXISTS workbooks CASCADE;

-- Note: We don't drop the uuid-ossp extension as it may be used by other tables
