-- Migration: Create Univer Workbooks Schema
-- Description: Creates tables for Univer spreadsheet workbooks, version history, and AI interactions
-- Requirements: 3.2.1, 3.2.2, 3.2.3, 3.2.4
-- Feature: univer-integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Workbooks Table
-- ============================================================================
-- Stores the main workbook data including all sheets, cells, and formatting
CREATE TABLE IF NOT EXISTS workbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workbooks_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT workbooks_data_is_object CHECK (jsonb_typeof(data) = 'object')
);

-- ============================================================================
-- Workbook History Table
-- ============================================================================
-- Stores version snapshots of workbooks for history tracking and restore
CREATE TABLE IF NOT EXISTS workbook_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workbook_id UUID NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workbook_history_snapshot_is_object CHECK (jsonb_typeof(snapshot) = 'object')
);

-- ============================================================================
-- AI Spreadsheet Interactions Table
-- ============================================================================
-- Logs all AI interactions with spreadsheets for analytics and debugging
CREATE TABLE IF NOT EXISTS ai_spreadsheet_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workbook_id UUID NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  intent TEXT,
  parameters JSONB,
  result JSONB,
  success BOOLEAN DEFAULT false,
  error TEXT,
  execution_time INTEGER, -- milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ai_interactions_command_not_empty CHECK (length(trim(command)) > 0),
  CONSTRAINT ai_interactions_execution_time_positive CHECK (execution_time IS NULL OR execution_time >= 0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Workbooks indexes
CREATE INDEX IF NOT EXISTS idx_workbooks_user_id ON workbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_updated_at ON workbooks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workbooks_user_updated ON workbooks(user_id, updated_at DESC);

-- Workbook history indexes
CREATE INDEX IF NOT EXISTS idx_workbook_history_workbook_id ON workbook_history(workbook_id);
CREATE INDEX IF NOT EXISTS idx_workbook_history_created_at ON workbook_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workbook_history_workbook_created ON workbook_history(workbook_id, created_at DESC);

-- AI interactions indexes
CREATE INDEX IF NOT EXISTS idx_ai_interactions_workbook_id ON ai_spreadsheet_interactions(workbook_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_spreadsheet_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_spreadsheet_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_success ON ai_spreadsheet_interactions(success);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_workbook_created ON ai_spreadsheet_interactions(workbook_id, created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_spreadsheet_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Workbooks Policies
-- ============================================================================

-- Policy: Users can view their own workbooks
CREATE POLICY "Users can view their own workbooks"
  ON workbooks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own workbooks
CREATE POLICY "Users can insert their own workbooks"
  ON workbooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workbooks
CREATE POLICY "Users can update their own workbooks"
  ON workbooks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own workbooks
CREATE POLICY "Users can delete their own workbooks"
  ON workbooks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Workbook History Policies
-- ============================================================================

-- Policy: Users can view their own workbook history
CREATE POLICY "Users can view their own workbook history"
  ON workbook_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own workbook history
CREATE POLICY "Users can insert their own workbook history"
  ON workbook_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own workbook history
CREATE POLICY "Users can delete their own workbook history"
  ON workbook_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI Spreadsheet Interactions Policies
-- ============================================================================

-- Policy: Users can view their own AI interactions
CREATE POLICY "Users can view their own AI interactions"
  ON ai_spreadsheet_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own AI interactions
CREATE POLICY "Users can insert their own AI interactions"
  ON ai_spreadsheet_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own AI interactions
CREATE POLICY "Users can delete their own AI interactions"
  ON ai_spreadsheet_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update workbooks.updated_at on UPDATE
DROP TRIGGER IF EXISTS trigger_update_workbooks_updated_at ON workbooks;
CREATE TRIGGER trigger_update_workbooks_updated_at
  BEFORE UPDATE ON workbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_workbooks_updated_at();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE workbooks IS 'Stores Univer spreadsheet workbooks with all data in JSONB format';
COMMENT ON TABLE workbook_history IS 'Version history snapshots for workbooks';
COMMENT ON TABLE ai_spreadsheet_interactions IS 'Logs of AI interactions with spreadsheets';

COMMENT ON COLUMN workbooks.data IS 'Complete workbook data including sheets, cells, formulas, and formatting';
COMMENT ON COLUMN workbook_history.snapshot IS 'Complete snapshot of workbook data at a point in time';
COMMENT ON COLUMN ai_spreadsheet_interactions.command IS 'Natural language command from user';
COMMENT ON COLUMN ai_spreadsheet_interactions.intent IS 'Parsed intent of the command';
COMMENT ON COLUMN ai_spreadsheet_interactions.parameters IS 'Extracted parameters from the command';
COMMENT ON COLUMN ai_spreadsheet_interactions.result IS 'Result of the AI operation';
COMMENT ON COLUMN ai_spreadsheet_interactions.execution_time IS 'Time taken to execute the command in milliseconds';
