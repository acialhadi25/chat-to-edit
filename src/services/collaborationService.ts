// @ts-nocheck
/**
 * Collaboration Service
 * 
 * Service for collaboration features including comments, change tracking, and permissions.
 * 
 * Requirements: 4.3.2, 4.3.4, 4.3.5
 * Documentation: docs/univer/features/comments.md
 */

import type { FUniver } from '@univerjs/facade';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CommentData {
  id: string;
  content: string;
  cellNotation: string;
  row: number;
  column: number;
  author?: string;
  timestamp: Date;
  isRoot: boolean;
  replyCount: number;
  resolved?: boolean;
}

export interface CommentReply {
  id: string;
  parentId: string;
  content: string;
  author?: string;
  timestamp: Date;
}

export interface ChangeRecord {
  id: string;
  type: 'cell_edit' | 'formula_change' | 'format_change' | 'row_insert' | 'row_delete' | 'column_insert' | 'column_delete';
  target: string;
  oldValue?: any;
  newValue?: any;
  userId?: string;
  timestamp: Date;
  description: string;
}

export type PermissionLevel = 'owner' | 'editor' | 'viewer' | 'commenter';

export interface UserPermission {
  userId: string;
  level: PermissionLevel;
  grantedBy?: string;
  grantedAt: Date;
}

export interface PermissionCheck {
  canRead: boolean;
  canWrite: boolean;
  canComment: boolean;
  canManagePermissions: boolean;
}

// ============================================================================
// Collaboration Service
// ============================================================================

/**
 * Service for managing collaboration features
 * 
 * Features:
 * - Comments on cells with threading
 * - Change tracking and history
 * - Permission management
 */
export class CollaborationService {
  private univerAPI: FUniver | null = null;
  private changeHistory: ChangeRecord[] = [];
  private permissions: Map<string, UserPermission> = new Map();
  private currentUserId: string = 'default-user';

  /**
   * Initialize collaboration service
   */
  initialize(univerAPI: FUniver, userId?: string): void {
    this.univerAPI = univerAPI;
    if (userId) {
      this.currentUserId = userId;
    }
  }

  // ============================================================================
  // Comments (Requirements 4.3.2)
  // ============================================================================

  /**
   * Add comment to a cell
   * 
   * @param cell - Cell reference (e.g., 'A1')
   * @param content - Comment content
   * @param author - Author name (optional)
   * @returns Comment ID if successful
   */
  async addComment(cell: string, content: string, author?: string): Promise<string | null> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('comment')) {
      throw new Error('User does not have permission to add comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      // Create rich text content
      const richText = this.univerAPI.newRichText().insertText(content);
      
      // Generate unique comment ID
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create comment builder
      const commentBuilder = this.univerAPI.newTheadComment()
        .setContent(richText)
        .setId(commentId);
      
      // Set author if provided
      if (author) {
        commentBuilder.setPersonId(author);
      }
      
      // Set timestamp
      commentBuilder.setDateTime(new Date());
      
      // Add comment to cell
      const range = activeSheet.getRange(cell);
      const success = await range.addCommentAsync(commentBuilder);
      
      if (success) {
        // Track change
        this.trackChange({
          type: 'cell_edit',
          target: cell,
          newValue: `Comment added: ${content}`,
          description: `Added comment to ${cell}`,
        });
        
        return commentId;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * Get all comments in the active worksheet
   * 
   * @returns Array of comment data
   */
  getComments(): CommentData[] {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const comments = activeSheet.getComments();
    
    return comments.map(comment => {
      const range = comment.getRange();
      const commentData = comment.getCommentData();
      
      return {
        id: commentData.id,
        content: comment.getRichText().toPlainText(),
        cellNotation: range.getA1Notation(),
        row: range.getRow(),
        column: range.getColumn(),
        author: commentData.personId,
        timestamp: commentData.dT ? new Date(commentData.dT) : new Date(),
        isRoot: comment.getIsRoot(),
        replyCount: comment.getIsRoot() ? comment.getReplies().length : 0,
        resolved: commentData.resolved,
      };
    });
  }

  /**
   * Get comments in a specific range
   * 
   * @param range - Range reference (e.g., 'A1:B10')
   * @returns Array of comment data
   */
  getCommentsInRange(range: string): CommentData[] {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const rangeObj = activeSheet.getRange(range);
    const comments = rangeObj.getComments();
    
    return comments.map(comment => {
      const commentRange = comment.getRange();
      const commentData = comment.getCommentData();
      
      return {
        id: commentData.id,
        content: comment.getRichText().toPlainText(),
        cellNotation: commentRange.getA1Notation(),
        row: commentRange.getRow(),
        column: commentRange.getColumn(),
        author: commentData.personId,
        timestamp: commentData.dT ? new Date(commentData.dT) : new Date(),
        isRoot: comment.getIsRoot(),
        replyCount: comment.getIsRoot() ? comment.getReplies().length : 0,
        resolved: commentData.resolved,
      };
    });
  }

  /**
   * Get comment by ID
   * 
   * @param commentId - Comment ID
   * @returns Comment data or null
   */
  getCommentById(commentId: string): CommentData | null {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const comment = activeSheet.getCommentById(commentId);
    if (!comment) {
      return null;
    }

    const range = comment.getRange();
    const commentData = comment.getCommentData();
    
    return {
      id: commentData.id,
      content: comment.getRichText().toPlainText(),
      cellNotation: range.getA1Notation(),
      row: range.getRow(),
      column: range.getColumn(),
      author: commentData.personId,
      timestamp: commentData.dT ? new Date(commentData.dT) : new Date(),
      isRoot: comment.getIsRoot(),
      replyCount: comment.getIsRoot() ? comment.getReplies().length : 0,
      resolved: commentData.resolved,
    };
  }

  /**
   * Reply to a comment
   * 
   * @param commentId - Parent comment ID
   * @param content - Reply content
   * @param author - Author name (optional)
   * @returns Success status
   */
  async replyToComment(commentId: string, content: string, author?: string): Promise<boolean> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('comment')) {
      throw new Error('User does not have permission to reply to comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      const comment = activeSheet.getCommentById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (!comment.getIsRoot()) {
        throw new Error('Cannot reply to non-root comment');
      }

      // Create reply
      const replyText = this.univerAPI.newRichText().insertText(content);
      const reply = this.univerAPI.newTheadComment().setContent(replyText);
      
      if (author) {
        reply.setPersonId(author);
      }
      
      reply.setDateTime(new Date());
      
      // Add reply
      await comment.replyAsync(reply);
      
      // Track change
      this.trackChange({
        type: 'cell_edit',
        target: comment.getRange().getA1Notation(),
        newValue: `Reply added: ${content}`,
        description: `Added reply to comment ${commentId}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error replying to comment:', error);
      return false;
    }
  }

  /**
   * Get replies for a comment
   * 
   * @param commentId - Parent comment ID
   * @returns Array of reply data
   */
  getReplies(commentId: string): CommentReply[] {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const comment = activeSheet.getCommentById(commentId);
    if (!comment || !comment.getIsRoot()) {
      return [];
    }

    const replies = comment.getReplies();
    
    return replies.map(reply => {
      const replyData = reply.getCommentData();
      return {
        id: replyData.id,
        parentId: commentId,
        content: reply.getRichText().toPlainText(),
        author: replyData.personId,
        timestamp: replyData.dT ? new Date(replyData.dT) : new Date(),
      };
    });
  }

  /**
   * Update comment content
   * 
   * @param commentId - Comment ID
   * @param newContent - New content
   * @returns Success status
   */
  async updateComment(commentId: string, newContent: string): Promise<boolean> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('comment')) {
      throw new Error('User does not have permission to update comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      const comment = activeSheet.getCommentById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const oldContent = comment.getRichText().toPlainText();
      const newRichText = this.univerAPI.newRichText().insertText(newContent);
      
      await comment.updateAsync(newRichText);
      
      // Track change
      this.trackChange({
        type: 'cell_edit',
        target: comment.getRange().getA1Notation(),
        oldValue: `Comment: ${oldContent}`,
        newValue: `Comment: ${newContent}`,
        description: `Updated comment ${commentId}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  }

  /**
   * Delete comment
   * 
   * @param commentId - Comment ID
   * @returns Success status
   */
  async deleteComment(commentId: string): Promise<boolean> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('comment')) {
      throw new Error('User does not have permission to delete comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      const comment = activeSheet.getCommentById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const cellNotation = comment.getRange().getA1Notation();
      const content = comment.getRichText().toPlainText();
      
      await comment.deleteAsync();
      
      // Track change
      this.trackChange({
        type: 'cell_edit',
        target: cellNotation,
        oldValue: `Comment: ${content}`,
        description: `Deleted comment ${commentId}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  /**
   * Resolve comment
   * 
   * @param commentId - Comment ID
   * @returns Success status
   */
  async resolveComment(commentId: string): Promise<boolean> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('comment')) {
      throw new Error('User does not have permission to resolve comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      const comment = activeSheet.getCommentById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      await comment.resolveAsync();
      
      // Track change
      this.trackChange({
        type: 'cell_edit',
        target: comment.getRange().getA1Notation(),
        newValue: 'Comment resolved',
        description: `Resolved comment ${commentId}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error resolving comment:', error);
      return false;
    }
  }

  /**
   * Clear all comments in a range
   * 
   * @param range - Range reference (e.g., 'A1:B10')
   * @returns Success status
   */
  async clearCommentsInRange(range: string): Promise<boolean> {
    if (!this.univerAPI) {
      throw new Error('Collaboration service not initialized');
    }

    if (!this.checkPermission('write')) {
      throw new Error('User does not have permission to clear comments');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    try {
      const rangeObj = activeSheet.getRange(range);
      await rangeObj.clearCommentsAsync();
      
      // Track change
      this.trackChange({
        type: 'cell_edit',
        target: range,
        description: `Cleared all comments in ${range}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing comments:', error);
      return false;
    }
  }

  // ============================================================================
  // Change Tracking (Requirements 4.3.4)
  // ============================================================================

  /**
   * Track a change
   * 
   * @param change - Partial change record (id and timestamp will be auto-generated)
   */
  private trackChange(change: Omit<ChangeRecord, 'id' | 'timestamp' | 'userId'>): void {
    const record: ChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUserId,
      timestamp: new Date(),
      ...change,
    };

    this.changeHistory.push(record);

    // Keep only last 1000 changes to prevent memory issues
    if (this.changeHistory.length > 1000) {
      this.changeHistory = this.changeHistory.slice(-1000);
    }
  }

  /**
   * Get change history
   * 
   * @param options - Filter options
   * @returns Array of change records
   */
  getChangeHistory(options?: {
    userId?: string;
    type?: ChangeRecord['type'];
    target?: string;
    since?: Date;
    limit?: number;
  }): ChangeRecord[] {
    let filtered = [...this.changeHistory];

    if (options?.userId) {
      filtered = filtered.filter(c => c.userId === options.userId);
    }

    if (options?.type) {
      filtered = filtered.filter(c => c.type === options.type);
    }

    if (options?.target) {
      filtered = filtered.filter(c => c.target === options.target);
    }

    if (options?.since) {
      filtered = filtered.filter(c => c.timestamp >= options.since!);
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Clear change history
   */
  clearChangeHistory(): void {
    this.changeHistory = [];
  }

  /**
   * Export change history
   * 
   * @returns JSON string of change history
   */
  exportChangeHistory(): string {
    return JSON.stringify(this.changeHistory, null, 2);
  }

  // ============================================================================
  // Permission Management (Requirements 4.3.5)
  // ============================================================================

  /**
   * Set user permission
   * 
   * @param userId - User ID
   * @param level - Permission level
   */
  setPermission(userId: string, level: PermissionLevel): void {
    if (!this.checkPermission('manage_permissions')) {
      throw new Error('User does not have permission to manage permissions');
    }

    this.permissions.set(userId, {
      userId,
      level,
      grantedBy: this.currentUserId,
      grantedAt: new Date(),
    });

    // Track change
    this.trackChange({
      type: 'cell_edit',
      target: 'permissions',
      newValue: `${userId}: ${level}`,
      description: `Set permission for ${userId} to ${level}`,
    });
  }

  /**
   * Get user permission
   * 
   * @param userId - User ID
   * @returns User permission or null
   */
  getPermission(userId: string): UserPermission | null {
    return this.permissions.get(userId) || null;
  }

  /**
   * Remove user permission
   * 
   * @param userId - User ID
   */
  removePermission(userId: string): void {
    if (!this.checkPermission('manage_permissions')) {
      throw new Error('User does not have permission to manage permissions');
    }

    this.permissions.delete(userId);

    // Track change
    this.trackChange({
      type: 'cell_edit',
      target: 'permissions',
      oldValue: `${userId} permission`,
      description: `Removed permission for ${userId}`,
    });
  }

  /**
   * Get all permissions
   * 
   * @returns Array of user permissions
   */
  getAllPermissions(): UserPermission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Check if current user has permission
   * 
   * @param action - Action to check ('read', 'write', 'comment', 'manage_permissions')
   * @returns True if user has permission
   */
  checkPermission(action: 'read' | 'write' | 'comment' | 'manage_permissions'): boolean {
    const permission = this.permissions.get(this.currentUserId);
    
    if (!permission) {
      // Default to editor if no permission set
      return action !== 'manage_permissions';
    }

    const level = permission.level;

    switch (action) {
      case 'read':
        return ['owner', 'editor', 'viewer', 'commenter'].includes(level);
      case 'write':
        return ['owner', 'editor'].includes(level);
      case 'comment':
        return ['owner', 'editor', 'commenter'].includes(level);
      case 'manage_permissions':
        return level === 'owner';
      default:
        return false;
    }
  }

  /**
   * Get permission check for current user
   * 
   * @returns Permission check object
   */
  getPermissionCheck(): PermissionCheck {
    return {
      canRead: this.checkPermission('read'),
      canWrite: this.checkPermission('write'),
      canComment: this.checkPermission('comment'),
      canManagePermissions: this.checkPermission('manage_permissions'),
    };
  }

  /**
   * Set current user ID
   * 
   * @param userId - User ID
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get current user ID
   * 
   * @returns Current user ID
   */
  getCurrentUser(): string {
    return this.currentUserId;
  }
}
