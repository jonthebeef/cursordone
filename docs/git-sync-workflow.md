---
title: Git-Based Team Sync Workflow
description: Detailed explanation of Git-based task synchronization workflow for teams using CursorDone, including edge cases and best practices
type: guide
tags:
  - git
  - workflow
  - collaboration
  - team
created: "2024-01-22T18:00:00.000Z"
---

## Standard Workflow

### 1. Initial Setup

```bash
# Team member clones repository
git clone <repo-url>
cd <project>
cursordone init
cursordone start
```

### 2. Daily Flow

1. Start work session:
   ```bash
   git pull origin main
   cursordone start
   ```
2. Create/edit tasks through web UI or directly in files
3. Commit and push changes:
   ```bash
   git add tasks/ epics/
   git commit -m "Update tasks for feature X"
   git push origin main
   ```

## Automated Git Operations

### 1. Background Sync

- Automatic commits on task changes
- Periodic background pulls
- Smart batching to prevent commit spam
- Sync status indicators in UI

### 2. Conflict Management

- Automatic conflict detection
- Web-based merge resolution
- Front matter conflict handling
- Partial change acceptance

## Ref Management with Supabase

### 1. Ref Generation

- Supabase maintains ref ledger
- Atomic ref generation
- Team-scoped unique refs
- Offline queuing support

### 2. Ref Schema

```sql
tasks_refs (
  ref TEXT PRIMARY KEY,      -- TSK-123
  file_path TEXT NOT NULL,   -- tasks/implement-feature.md
  team_id TEXT NOT NULL,     -- For multi-team support
  created_at TIMESTAMPTZ,
  created_by TEXT,           -- User who created
  last_modified TIMESTAMPTZ
)

tasks_activity (
  ref TEXT REFERENCES tasks_refs(ref),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,      -- 'viewing', 'editing'
  timestamp TIMESTAMPTZ,
  PRIMARY KEY (ref, user_id)
)
```

### 3. Ref Workflows

1. Task Creation:

   - Generate local file
   - Request ref from Supabase
   - Update front matter
   - Git commit/push

2. Task Discovery:

   - Query Supabase refs
   - Show quick picker
   - Handle missing tasks
   - Update local state

3. Team Sync:
   - Check local tasks against refs
   - Request missing refs
   - Update ref metadata
   - Track team activity

## Edge Cases & Solutions

### 1. Concurrent Task Updates

- Git detects conflict during pull
- Web UI shows merge interface
- Most recent timestamp wins for front matter
- Manual merge for content conflicts

### 2. Deleted Tasks

- Git detects deleted file conflict
- Team communication required
- Restore from Git history if needed
- Archive instead of delete recommended

### 3. Task ID Conflicts

- Supabase ensures unique refs
- Include timestamp in ID
- Add username prefix
- Implement collision detection

### 4. Offline Work

- Queue ref requests
- Track local changes
- Sync when back online
- Handle ref conflicts

### 5. Branch Management

- Tasks follow code branches
- Mirror feature branches
- Merge task changes with code
- Track status across branches

## Best Practices

### 1. Sync Frequency

- Pull at session start
- Auto-commit on changes
- Regular background sync
- Push on task completion

### 2. Commit Guidelines

- One task per commit
- Clear commit messages
- Include task refs
- Group related changes

### 3. Conflict Prevention

- Use task assignments
- Regular team sync
- Clear ownership
- Quick conflict resolution

### 4. Branch Strategy

- Main branch for active
- Archive for completed
- Feature branch alignment
- Task-specific branches

## Team Communication

### 1. Status Updates

- Real-time editing indicators
- Activity feed
- Completion notifications
- Blocking status

### 2. Conflict Resolution

- Team protocol
- Designated resolver
- Document decisions
- Regular sync meetings

## Automation

### 1. Git Hooks

- Pre-commit validation
- Auto-formatting
- Ref validation
- Status updates

### 2. CI/CD Integration

- Task validation
- Automated merges
- Status updates
- Team notifications

## Recovery Procedures

### 1. Lost Changes

1. Check Git history
2. Review local changes
3. Restore from backup
4. Document incident

### 2. Corrupt State

1. Backup current state
2. Reset to last known good
3. Replay changes
4. Update procedures

## Future Enhancements

1. Automated conflict resolution
2. Real-time sync notifications
3. Branch-aware task management
4. Sync analytics dashboard
5. Team activity visualization
