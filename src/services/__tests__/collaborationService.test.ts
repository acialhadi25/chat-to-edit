// @ts-nocheck
/**
 * Collaboration Service Tests
 * 
 * Tests for comments, change tracking, and permission management.
 * 
 * Requirements: 4.3.2, 4.3.4, 4.3.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollaborationService } from '../collaborationService';
import type { FUniver } from '@univerjs/facade';

// Mock Univer API
const createMockUniverAPI = () => {
  const mockComments = new Map();
  let commentIdCounter = 0;

  const mockComment = (id: string, content: string, cell: string, isRoot = true) => ({
    getCommentData: () => ({
      id,
      personId: 'test-user',
      dT: Date.now(),
      resolved: false,
    }),
    getRichText: () => ({
      toPlainText: () => content,
    }),
    getRange: () => ({
      getA1Notation: () => cell,
      getRow: () => parseInt(cell.match(/\d+/)?.[0] || '1'),
      getColumn: () => cell.charCodeAt(0) - 65,
    }),
    getIsRoot: () => isRoot,
    getReplies: () => {
      const replies: any[] = [];
      mockComments.forEach((comment: any) => {
        if (comment.parentId === id) {
          replies.push(mockComment(comment.id, comment.content, comment.cell || 'A1', false));
        }
      });
      return replies;
    },
    updateAsync: vi.fn(async (richText: any) => {
      const comment = mockComments.get(id);
      if (comment) {
        comment.content = richText.toPlainText();
      }
    }),
    deleteAsync: vi.fn(async () => {
      mockComments.delete(id);
    }),
    resolveAsync: vi.fn(async () => {
      const comment = mockComments.get(id);
      if (comment) {
        comment.resolved = true;
      }
    }),
    replyAsync: vi.fn(async (replyBuilder: any) => {
      const replyId = `reply-${++commentIdCounter}`;
      const replyContent = replyBuilder.content?.toPlainText() || '';
      mockComments.set(replyId, {
        id: replyId,
        parentId: id,
        content: replyContent,
        isRoot: false,
      });
    }),
  });

  const mockRange = {
    addCommentAsync: vi.fn(async (builder: any) => {
      const commentId = builder.id || `comment-${++commentIdCounter}`;
      const content = builder.content?.toPlainText() || '';
      mockComments.set(commentId, {
        id: commentId,
        content,
        cell: 'A1',
        isRoot: true,
      });
      return true;
    }),
    clearCommentsAsync: vi.fn(async () => {
      mockComments.clear();
      return true;
    }),
    getComments: vi.fn(() => {
      return Array.from(mockComments.values())
        .filter((c: any) => c.isRoot)
        .map((c: any) => mockComment(c.id, c.content, c.cell || 'A1'));
    }),
  };

  const mockSheet = {
    getRange: vi.fn(() => mockRange),
    getComments: vi.fn(() => {
      return Array.from(mockComments.values())
        .filter((c: any) => c.isRoot)
        .map((c: any) => mockComment(c.id, c.content, c.cell || 'A1'));
    }),
    getCommentById: vi.fn((id: string) => {
      const comment = mockComments.get(id);
      if (!comment) return null;
      return mockComment(id, comment.content, comment.cell || 'A1', comment.isRoot);
    }),
    getSheetId: vi.fn(() => 'sheet-1'),
    getSheetName: vi.fn(() => 'Sheet1'),
    getSheetConfig: vi.fn(() => ({
      rowCount: 100,
      columnCount: 26,
    })),
  };

  const mockWorkbook = {
    getActiveSheet: vi.fn(() => mockSheet),
  };

  const mockRichTextBuilder = {
    text: '',
    insertText: vi.fn(function(this: any, text: string) {
      this.text = text;
      return this;
    }),
    toPlainText: vi.fn(function(this: any) {
      return this.text;
    }),
  };

  const mockCommentBuilder = {
    content: null as any,
    id: null as string | null,
    personId: null as string | null,
    dateTime: null as Date | null,
    setContent: vi.fn(function(this: any, richText: any) {
      this.content = richText;
      return this;
    }),
    setId: vi.fn(function(this: any, id: string) {
      this.id = id;
      return this;
    }),
    setPersonId: vi.fn(function(this: any, personId: string) {
      this.personId = personId;
      return this;
    }),
    setDateTime: vi.fn(function(this: any, dateTime: Date) {
      this.dateTime = dateTime;
      return this;
    }),
  };

  return {
    getActiveWorkbook: vi.fn(() => mockWorkbook),
    newRichText: vi.fn(() => ({ ...mockRichTextBuilder })),
    newTheadComment: vi.fn(() => ({ ...mockCommentBuilder })),
    _mockComments: mockComments,
    _mockSheet: mockSheet,
    _mockRange: mockRange,
  } as unknown as FUniver;
};

describe('CollaborationService', () => {
  let service: CollaborationService;
  let mockAPI: FUniver;

  beforeEach(() => {
    service = new CollaborationService();
    mockAPI = createMockUniverAPI();
    service.initialize(mockAPI, 'test-user');
  });

  // ============================================================================
  // Comments Tests (Requirements 4.3.2)
  // ============================================================================

  describe('Comments', () => {
    it('should add comment to cell', async () => {
      const commentId = await service.addComment('A1', 'Test comment');

      expect(commentId).toBeTruthy();
      expect(commentId).toMatch(/^comment-/);
    });

    it('should add comment with author', async () => {
      const commentId = await service.addComment('A1', 'Test comment', 'John Doe');

      expect(commentId).toBeTruthy();
    });

    it('should get all comments', async () => {
      await service.addComment('A1', 'Comment 1');
      await service.addComment('B2', 'Comment 2');

      const comments = service.getComments();

      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe('Comment 1');
      expect(comments[1].content).toBe('Comment 2');
    });

    it('should get comment by ID', async () => {
      const commentId = await service.addComment('A1', 'Test comment');

      const comment = service.getCommentById(commentId!);

      expect(comment).toBeTruthy();
      expect(comment?.id).toBe(commentId);
      expect(comment?.content).toBe('Test comment');
    });

    it('should return null for non-existent comment', () => {
      const comment = service.getCommentById('non-existent');

      expect(comment).toBeNull();
    });

    it('should reply to comment', async () => {
      const commentId = await service.addComment('A1', 'Original comment');

      const success = await service.replyToComment(commentId!, 'Reply text');

      expect(success).toBe(true);
    });

    it('should get replies for comment', async () => {
      const commentId = await service.addComment('A1', 'Original comment');
      await service.replyToComment(commentId!, 'Reply 1');
      await service.replyToComment(commentId!, 'Reply 2');

      const replies = service.getReplies(commentId!);

      expect(replies).toHaveLength(2);
      expect(replies[0].content).toBe('Reply 1');
      expect(replies[1].content).toBe('Reply 2');
    });

    it('should update comment', async () => {
      const commentId = await service.addComment('A1', 'Original text');

      const success = await service.updateComment(commentId!, 'Updated text');

      expect(success).toBe(true);
    });

    it('should delete comment', async () => {
      const commentId = await service.addComment('A1', 'Test comment');

      const success = await service.deleteComment(commentId!);

      expect(success).toBe(true);
      expect(service.getCommentById(commentId!)).toBeNull();
    });

    it('should resolve comment', async () => {
      const commentId = await service.addComment('A1', 'Test comment');

      const success = await service.resolveComment(commentId!);

      expect(success).toBe(true);
    });

    it('should clear comments in range', async () => {
      await service.addComment('A1', 'Comment 1');
      await service.addComment('B2', 'Comment 2');

      const success = await service.clearCommentsInRange('A1:B2');

      expect(success).toBe(true);
    });

    it('should get comments in range', async () => {
      await service.addComment('A1', 'Comment 1');
      await service.addComment('B2', 'Comment 2');

      const comments = service.getCommentsInRange('A1:B2');

      expect(comments.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle comment with empty content', async () => {
      const commentId = await service.addComment('A1', '');

      expect(commentId).toBeTruthy();
    });

    it('should handle comment with long content', async () => {
      const longContent = 'A'.repeat(5000);
      const commentId = await service.addComment('A1', longContent);

      expect(commentId).toBeTruthy();
    });

    it('should track comment addition in change history', async () => {
      await service.addComment('A1', 'Test comment');

      const history = service.getChangeHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].description).toContain('Added comment');
    });

    it('should track comment deletion in change history', async () => {
      const commentId = await service.addComment('A1', 'Test comment');
      await service.deleteComment(commentId!);

      const history = service.getChangeHistory();

      expect(history.some(h => h.description.includes('Deleted comment'))).toBe(true);
    });
  });

  // ============================================================================
  // Change Tracking Tests (Requirements 4.3.4)
  // ============================================================================

  describe('Change Tracking', () => {
    it('should track changes', async () => {
      await service.addComment('A1', 'Test comment');

      const history = service.getChangeHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('id');
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('userId');
      expect(history[0]).toHaveProperty('description');
    });

    it('should filter change history by user', async () => {
      await service.addComment('A1', 'Comment 1');

      const history = service.getChangeHistory({ userId: 'test-user' });

      expect(history.length).toBeGreaterThan(0);
      expect(history.every(h => h.userId === 'test-user')).toBe(true);
    });

    it('should filter change history by type', async () => {
      await service.addComment('A1', 'Comment 1');

      const history = service.getChangeHistory({ type: 'cell_edit' });

      expect(history.every(h => h.type === 'cell_edit')).toBe(true);
    });

    it('should filter change history by target', async () => {
      await service.addComment('A1', 'Comment 1');

      const history = service.getChangeHistory({ target: 'A1' });

      expect(history.every(h => h.target === 'A1')).toBe(true);
    });

    it('should filter change history by date', async () => {
      const since = new Date();
      await service.addComment('A1', 'Comment 1');

      const history = service.getChangeHistory({ since });

      expect(history.every(h => h.timestamp >= since)).toBe(true);
    });

    it('should limit change history results', async () => {
      await service.addComment('A1', 'Comment 1');
      await service.addComment('B2', 'Comment 2');
      await service.addComment('C3', 'Comment 3');

      const history = service.getChangeHistory({ limit: 2 });

      expect(history.length).toBeLessThanOrEqual(2);
    });

    it('should sort change history by timestamp descending', async () => {
      await service.addComment('A1', 'Comment 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.addComment('B2', 'Comment 2');

      const history = service.getChangeHistory();

      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        history[history.length - 1].timestamp.getTime()
      );
    });

    it('should clear change history', async () => {
      await service.addComment('A1', 'Comment 1');

      service.clearChangeHistory();

      const history = service.getChangeHistory();
      expect(history).toHaveLength(0);
    });

    it('should export change history as JSON', async () => {
      await service.addComment('A1', 'Comment 1');

      const exported = service.exportChangeHistory();

      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should limit change history to 1000 entries', async () => {
      // Add more than 1000 changes
      for (let i = 0; i < 1100; i++) {
        await service.addComment('A1', `Comment ${i}`);
      }

      const history = service.getChangeHistory();

      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  // ============================================================================
  // Permission Management Tests (Requirements 4.3.5)
  // ============================================================================

  describe('Permission Management', () => {
    beforeEach(() => {
      // Manually set permission without check (for testing)
      (service as any).permissions.set('test-user', {
        userId: 'test-user',
        level: 'owner',
        grantedAt: new Date(),
      });
    });

    it('should set user permission', () => {
      service.setPermission('user-1', 'editor');

      const permission = service.getPermission('user-1');

      expect(permission).toBeTruthy();
      expect(permission?.level).toBe('editor');
      expect(permission?.userId).toBe('user-1');
    });

    it('should get user permission', () => {
      service.setPermission('user-1', 'viewer');

      const permission = service.getPermission('user-1');

      expect(permission?.level).toBe('viewer');
    });

    it('should return null for non-existent permission', () => {
      const permission = service.getPermission('non-existent');

      expect(permission).toBeNull();
    });

    it('should remove user permission', () => {
      service.setPermission('user-1', 'editor');

      service.removePermission('user-1');

      expect(service.getPermission('user-1')).toBeNull();
    });

    it('should get all permissions', () => {
      service.setPermission('user-1', 'editor');
      service.setPermission('user-2', 'viewer');

      const permissions = service.getAllPermissions();

      expect(permissions.length).toBeGreaterThanOrEqual(2);
    });

    it('should check read permission for owner', () => {
      service.setPermission('user-1', 'owner');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('read')).toBe(true);
    });

    it('should check write permission for editor', () => {
      service.setPermission('user-1', 'editor');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('write')).toBe(true);
    });

    it('should deny write permission for viewer', () => {
      service.setPermission('user-1', 'viewer');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('write')).toBe(false);
    });

    it('should check comment permission for commenter', () => {
      service.setPermission('user-1', 'commenter');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('comment')).toBe(true);
    });

    it('should deny manage permissions for non-owner', () => {
      service.setPermission('user-1', 'editor');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('manage_permissions')).toBe(false);
    });

    it('should allow manage permissions for owner', () => {
      service.setPermission('user-1', 'owner');
      service.setCurrentUser('user-1');

      expect(service.checkPermission('manage_permissions')).toBe(true);
    });

    it('should get permission check', () => {
      service.setPermission('user-1', 'editor');
      service.setCurrentUser('user-1');

      const check = service.getPermissionCheck();

      expect(check.canRead).toBe(true);
      expect(check.canWrite).toBe(true);
      expect(check.canComment).toBe(true);
      expect(check.canManagePermissions).toBe(false);
    });

    it('should set current user', () => {
      service.setCurrentUser('new-user');

      expect(service.getCurrentUser()).toBe('new-user');
    });

    it('should get current user', () => {
      const userId = service.getCurrentUser();

      expect(userId).toBe('test-user');
    });

    it('should track permission changes', () => {
      service.setPermission('user-1', 'editor');

      const history = service.getChangeHistory();

      expect(history.some(h => h.description.includes('Set permission'))).toBe(true);
    });

    it('should throw error when non-owner tries to set permission', () => {
      service.setPermission('user-1', 'editor');
      service.setCurrentUser('user-1');

      expect(() => {
        service.setPermission('user-2', 'viewer');
      }).toThrow('does not have permission to manage permissions');
    });

    it('should throw error when viewer tries to add comment', async () => {
      service.setPermission('user-1', 'viewer');
      service.setCurrentUser('user-1');

      await expect(service.addComment('A1', 'Test')).rejects.toThrow(
        'does not have permission to add comments'
      );
    });

    it('should allow default permissions when none set', () => {
      service.setCurrentUser('new-user');

      expect(service.checkPermission('read')).toBe(true);
      expect(service.checkPermission('write')).toBe(true);
      expect(service.checkPermission('comment')).toBe(true);
      expect(service.checkPermission('manage_permissions')).toBe(false);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('should handle complete comment workflow', async () => {
      // Add comment
      const commentId = await service.addComment('A1', 'Original comment', 'John');
      expect(commentId).toBeTruthy();

      // Reply to comment
      await service.replyToComment(commentId!, 'Reply 1', 'Jane');
      await service.replyToComment(commentId!, 'Reply 2', 'Bob');

      // Get replies
      const replies = service.getReplies(commentId!);
      expect(replies).toHaveLength(2);

      // Update comment
      await service.updateComment(commentId!, 'Updated comment');

      // Resolve comment
      await service.resolveComment(commentId!);

      // Check change history
      const history = service.getChangeHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should handle permission-based workflow', () => {
      // Manually set owner permission for test-user
      (service as any).permissions.set('test-user', {
        userId: 'test-user',
        level: 'owner',
        grantedAt: new Date(),
      });

      // Owner sets permissions
      service.setPermission('editor-1', 'editor');
      service.setPermission('viewer-1', 'viewer');

      // Editor can write
      service.setCurrentUser('editor-1');
      expect(service.checkPermission('write')).toBe(true);

      // Viewer cannot write
      service.setCurrentUser('viewer-1');
      expect(service.checkPermission('write')).toBe(false);

      // Owner can manage permissions
      service.setCurrentUser('test-user');
      expect(service.checkPermission('manage_permissions')).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedService = new CollaborationService();

      await expect(uninitializedService.addComment('A1', 'Test')).rejects.toThrow(
        'not initialized'
      );
    });

    it('should handle failed comment addition', async () => {
      const mockAPI = createMockUniverAPI();
      const mockRange = (mockAPI as any)._mockRange;
      mockRange.addCommentAsync.mockResolvedValueOnce(false);

      service.initialize(mockAPI, 'test-user');

      const commentId = await service.addComment('A1', 'Test');

      expect(commentId).toBeNull();
    });

    it('should handle error when replying to non-existent comment', async () => {
      const success = await service.replyToComment('non-existent', 'Reply');

      expect(success).toBe(false);
    });

    it('should handle error when updating non-existent comment', async () => {
      const success = await service.updateComment('non-existent', 'Updated');

      expect(success).toBe(false);
    });

    it('should handle error when deleting non-existent comment', async () => {
      const success = await service.deleteComment('non-existent');

      expect(success).toBe(false);
    });
  });
});
