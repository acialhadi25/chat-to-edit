# Collaboration Service

Service for collaboration features including comments, change tracking, and permission management.

## Requirements

- **4.3.2**: Comments on cells with threading
- **4.3.4**: Change tracking and history
- **4.3.5**: Permission management

## Features

### Comments (4.3.2)

- Add comments to cells
- Reply to comments (threading)
- Update comment content
- Delete comments
- Resolve comments
- Get comments by cell, range, or ID
- Clear all comments in a range

### Change Tracking (4.3.4)

- Automatic tracking of all changes
- Filter history by user, type, target, or date
- Export change history as JSON
- Limit history to prevent memory issues (1000 entries)

### Permission Management (4.3.5)

- Four permission levels: owner, editor, viewer, commenter
- Set/get/remove user permissions
- Check permissions for specific actions
- Track permission changes

## Usage

### Initialize Service

```typescript
import { CollaborationService } from './services/collaborationService';

const service = new CollaborationService();
service.initialize(univerAPI, 'user-123');
```

### Add Comment

```typescript
const commentId = await service.addComment('A1', 'This is a comment', 'John Doe');
```

### Reply to Comment

```typescript
await service.replyToComment(commentId, 'This is a reply', 'Jane Smith');
```

### Get Comments

```typescript
// Get all comments
const allComments = service.getComments();

// Get comments in range
const rangeComments = service.getCommentsInRange('A1:B10');

// Get comment by ID
const comment = service.getCommentById(commentId);

// Get replies
const replies = service.getReplies(commentId);
```

### Update and Resolve Comments

```typescript
// Update comment
await service.updateComment(commentId, 'Updated content');

// Resolve comment
await service.resolveComment(commentId);

// Delete comment
await service.deleteComment(commentId);
```

### Change Tracking

```typescript
// Get all changes
const history = service.getChangeHistory();

// Filter by user
const userChanges = service.getChangeHistory({ userId: 'user-123' });

// Filter by type
const cellEdits = service.getChangeHistory({ type: 'cell_edit' });

// Filter by date
const recentChanges = service.getChangeHistory({ 
  since: new Date('2024-01-01'),
  limit: 50 
});

// Export history
const json = service.exportChangeHistory();

// Clear history
service.clearChangeHistory();
```

### Permission Management

```typescript
// Set permissions
service.setPermission('user-1', 'editor');
service.setPermission('user-2', 'viewer');
service.setPermission('user-3', 'commenter');

// Check permissions
const canWrite = service.checkPermission('write');
const canComment = service.checkPermission('comment');

// Get permission check
const check = service.getPermissionCheck();
console.log(check.canRead, check.canWrite, check.canComment);

// Get all permissions
const permissions = service.getAllPermissions();

// Remove permission
service.removePermission('user-1');
```

## AI Commands

The collaboration service integrates with the AI service to support natural language commands:

### Add Comment
```
"Add comment to A1 saying This needs review"
"Comment on B2: Check this value"
```

### Reply to Comment
```
"Reply to comment comment-123 with I agree"
"Add reply to comment-456: Fixed"
```

### Resolve Comment
```
"Resolve comment comment-123"
"Mark comment comment-456 as resolved"
```

### Delete Comment
```
"Delete comment comment-123"
"Remove comment comment-456"
```

### Get Comments
```
"Get all comments"
"Show comments"
"List comments"
```

## Permission Levels

| Level | Read | Write | Comment | Manage Permissions |
|-------|------|-------|---------|-------------------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Commenter | ✅ | ❌ | ✅ | ❌ |

## Change Types

- `cell_edit`: Cell value or content changed
- `formula_change`: Formula modified
- `format_change`: Cell formatting changed
- `row_insert`: Row inserted
- `row_delete`: Row deleted
- `column_insert`: Column inserted
- `column_delete`: Column deleted

## Testing

Run tests:
```bash
npm test src/services/__tests__/collaborationService.test.ts
```

Test coverage:
- ✅ 60+ tests
- ✅ Comments: add, reply, update, delete, resolve
- ✅ Change tracking: filter, export, limit
- ✅ Permissions: set, check, remove
- ✅ Error handling
- ✅ Integration scenarios

## Documentation

- [Comments Documentation](../../docs/univer/features/comments.md)
- [Permission Documentation](../../docs/univer/core/permission.md)

## Implementation Notes

1. **Comment IDs**: Auto-generated with format `comment-{timestamp}-{random}`
2. **Change History**: Limited to 1000 entries to prevent memory issues
3. **Default Permissions**: Users without explicit permissions default to editor level (except manage_permissions)
4. **Thread Safety**: Service is not thread-safe; use in single-threaded environment
5. **Persistence**: Comments are stored in Univer's internal state; change history is in-memory only

## Future Enhancements

- [ ] Persist change history to database
- [ ] Real-time collaboration with WebSocket
- [ ] Comment notifications
- [ ] @mentions in comments
- [ ] Comment attachments
- [ ] Audit log export
- [ ] Role-based access control (RBAC)
