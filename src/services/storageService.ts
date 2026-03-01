// @ts-nocheck
/**
 * Storage Service for Univer Workbooks
 * 
 * Manages data persistence to Supabase database with auto-save functionality.
 * 
 * Features:
 * - Save/load workbooks to/from Supabase
 * - Auto-save with debouncing
 * - Version history tracking
 * - AI interaction logging
 * - Save status indicator
 * 
 * @see Requirements 3.2.1, 3.2.2, 3.2.3
 */

import { supabase } from '@/integrations/supabase/client';
import type { IWorkbookData } from '@/types/univer.types';
import {
  createSystemError,
  createPermissionError,
  createValidationError,
} from '@/utils/errors';
import { logError, logWarning, logInfo } from '@/utils/errorLogger';
import { withRetry, withFallback } from '@/utils/errorRecovery';

// ============================================================================
// Types
// ============================================================================

export interface Version {
  id: string;
  workbook_id: string;
  user_id: string;
  snapshot: IWorkbookData;
  description: string | null;
  created_at: string;
}

export interface AIInteraction {
  id: string;
  workbook_id: string;
  user_id: string;
  command: string;
  intent: string | null;
  parameters: Record<string, any> | null;
  result: any;
  success: boolean;
  error: string | null;
  execution_time: number | null;
  created_at: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveStatusInfo {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
}

// ============================================================================
// Storage Service Class
// ============================================================================

export class StorageService {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private autoSaveWorkbookId: string | null = null;
  private autoSaveCallback: (() => Promise<IWorkbookData>) | null = null;
  private saveStatus: SaveStatus = 'idle';
  private lastSaved: Date | null = null;
  private lastError: string | null = null;
  private statusListeners: Set<(status: SaveStatusInfo) => void> = new Set();

  /**
   * Save workbook to database
   */
  async saveWorkbook(workbookId: string, data: IWorkbookData): Promise<void> {
    try {
      // Validate inputs
      if (!workbookId || workbookId.trim().length === 0) {
        throw createValidationError.invalidWorksheet(workbookId);
      }
      
      if (!data || !data.name) {
        throw createValidationError.invalidDataType('IWorkbookData', typeof data);
      }

      this.updateStatus('saving');

      // Get current user with retry
      const { data: { user }, error: userError } = await withRetry(
        () => supabase.auth.getUser(),
        { maxAttempts: 2, delayMs: 500 }
      );
      
      if (userError || !user) {
        throw createPermissionError.unauthorized();
      }

      // Check if workbook exists
      const { data: existing, error: fetchError } = await (supabase as any)
        .from('workbooks')
        .select('id')
        .eq('id', workbookId)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new workbooks
        throw createSystemError.databaseError('check workbook existence', fetchError);
      }

      if (existing) {
        // Update existing workbook with retry
        const { error: updateError } = await withRetry(
          () => (supabase as any)
            .from('workbooks')
            .update({
              name: data.name,
              data: data as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', workbookId)
            .eq('user_id', user.id),
          { maxAttempts: 3, delayMs: 1000 }
        );

        if (updateError) {
          throw createSystemError.databaseError('update workbook', updateError);
        }
        
        await logInfo('Workbook updated successfully', {
          workbookId,
          operation: 'StorageService.saveWorkbook',
        });
      } else {
        // Insert new workbook with retry
        const { error: insertError } = await withRetry(
          () => (supabase as any)
            .from('workbooks')
            .insert({
              id: workbookId,
              user_id: user.id,
              name: data.name,
              data: data as any,
            }),
          { maxAttempts: 3, delayMs: 1000 }
        );

        if (insertError) {
          throw createSystemError.databaseError('insert workbook', insertError);
        }
        
        await logInfo('Workbook created successfully', {
          workbookId,
          operation: 'StorageService.saveWorkbook',
        });
      }

      this.updateStatus('saved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workbook';
      this.updateStatus('error', errorMessage);
      
      await logError(error, {
        workbookId,
        operation: 'StorageService.saveWorkbook',
      });
      
      throw error;
    }
  }

  /**
   * Load workbook from database
   */
  async loadWorkbook(workbookId: string): Promise<IWorkbookData> {
    try {
      // Validate input
      if (!workbookId || workbookId.trim().length === 0) {
        throw createValidationError.invalidWorksheet(workbookId);
      }

      // Get current user with retry
      const { data: { user }, error: userError } = await withRetry(
        () => supabase.auth.getUser(),
        { maxAttempts: 2, delayMs: 500 }
      );
      
      if (userError || !user) {
        throw createPermissionError.unauthorized();
      }

      // Fetch workbook with retry
      const { data, error } = await withRetry(
        () => (supabase as any)
          .from('workbooks')
          .select('*')
          .eq('id', workbookId)
          .eq('user_id', user.id)
          .single(),
        { maxAttempts: 3, delayMs: 1000 }
      );

      if (error) {
        throw createSystemError.databaseError('load workbook', error);
      }
      
      if (!data) {
        throw createValidationError.invalidWorksheet(workbookId);
      }

      await logInfo('Workbook loaded successfully', {
        workbookId,
        operation: 'StorageService.loadWorkbook',
      });

      return data.data as IWorkbookData;
    } catch (error) {
      await logError(error, {
        workbookId,
        operation: 'StorageService.loadWorkbook',
      });
      throw error;
    }
  }

  /**
   * Enable auto-save functionality
   * 
   * @param workbookId - ID of the workbook to auto-save
   * @param interval - Auto-save interval in milliseconds
   * @param getDataCallback - Callback to get current workbook data
   */
  enableAutoSave(
    workbookId: string,
    interval: number,
    getDataCallback: () => Promise<IWorkbookData>
  ): void {
    // Disable existing auto-save if any
    this.disableAutoSave();

    this.autoSaveWorkbookId = workbookId;
    this.autoSaveCallback = getDataCallback;

    // Set up debounced auto-save
    this.autoSaveTimer = setInterval(async () => {
      if (this.autoSaveCallback && this.autoSaveWorkbookId) {
        try {
          const data = await this.autoSaveCallback();
          await this.saveWorkbook(this.autoSaveWorkbookId, data);
        } catch (error) {
          await logWarning('Auto-save failed', {
            workbookId: this.autoSaveWorkbookId,
            operation: 'StorageService.autoSave',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
          });
          // Don't throw - auto-save failures should not interrupt user workflow
        }
      }
    }, interval);
    
    logInfo('Auto-save enabled', {
      workbookId,
      operation: 'StorageService.enableAutoSave',
      details: { interval },
    });
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSaveWorkbookId = null;
    this.autoSaveCallback = null;
  }

  /**
   * Save a version snapshot
   */
  async saveVersion(workbookId: string, description: string): Promise<string> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current workbook data
      const workbookData = await this.loadWorkbook(workbookId);

      // Insert version
      const { data, error } = await (supabase as any)
        .from('workbook_history')
        .insert({
          workbook_id: workbookId,
          user_id: user.id,
          snapshot: workbookData as any,
          description,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create version');

      return data.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save version';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get version history for a workbook
   */
  async getVersionHistory(workbookId: string): Promise<Version[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch version history
      const { data, error } = await (supabase as any)
        .from('workbook_history')
        .select('*')
        .eq('workbook_id', workbookId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Version[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get version history';
      throw new Error(errorMessage);
    }
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(workbookId: string, versionId: string): Promise<IWorkbookData> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch version
      const { data, error } = await (supabase as any)
        .from('workbook_history')
        .select('*')
        .eq('id', versionId)
        .eq('workbook_id', workbookId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Version not found');

      const snapshot = data.snapshot as IWorkbookData;

      // Save the restored version as current workbook
      await this.saveWorkbook(workbookId, snapshot);

      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore version';
      throw new Error(errorMessage);
    }
  }

  /**
   * Log an AI interaction
   */
  async logAIInteraction(interaction: Omit<AIInteraction, 'id' | 'created_at'>): Promise<void> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Insert interaction log
      const { error } = await (supabase as any)
        .from('ai_spreadsheet_interactions')
        .insert({
          workbook_id: interaction.workbook_id,
          user_id: user.id,
          command: interaction.command,
          intent: interaction.intent,
          parameters: interaction.parameters as any,
          result: interaction.result as any,
          success: interaction.success,
          error: interaction.error,
          execution_time: interaction.execution_time,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
      // Don't throw - logging failures should not interrupt user workflow
    }
  }

  /**
   * Get AI interaction history for a workbook
   */
  async getAIHistory(workbookId: string): Promise<AIInteraction[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch AI history
      const { data, error } = await (supabase as any)
        .from('ai_spreadsheet_interactions')
        .select('*')
        .eq('workbook_id', workbookId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to last 100 interactions

      if (error) throw error;

      return (data || []) as AIInteraction[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI history';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get current save status
   */
  getSaveStatus(): SaveStatusInfo {
    return {
      status: this.saveStatus,
      lastSaved: this.lastSaved,
      error: this.lastError,
    };
  }

  /**
   * Subscribe to save status changes
   */
  onStatusChange(listener: (status: SaveStatusInfo) => void): () => void {
    this.statusListeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Update save status and notify listeners
   */
  private updateStatus(status: SaveStatus, error: string | null = null): void {
    this.saveStatus = status;
    this.lastError = error;
    
    if (status === 'saved') {
      this.lastSaved = new Date();
    }

    const statusInfo: SaveStatusInfo = {
      status: this.saveStatus,
      lastSaved: this.lastSaved,
      error: this.lastError,
    };

    // Notify all listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(statusInfo);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const storageService = new StorageService();
