---
title: Add dynamic ref updates for manual tasks
status: todo
priority: high
epic: task-management-enhancement
complexity: S
tags:
  - enhancement
  - task refs
created: '2024-01-11'
---

Currently, when tasks are created manually by adding markdown files to the tasks directory, the TSK ref is not assigned until the page is refreshed. We need to make this process dynamic so refs are assigned immediately.

## Requirements

### File System Monitoring
- Watch the tasks directory for new files
- Detect when markdown files are added
- Ignore changes to existing files
- Handle multiple files being added simultaneously

### Ref Assignment
- Check if new files need refs
- Assign refs immediately when files are created
- Ensure no duplicate refs during concurrent operations
- Maintain ref counter state accurately

### UI Updates
- Trigger UI refresh when new refs are assigned
- Show new tasks with refs without page reload
- Handle errors gracefully
- Provide feedback when refs are assigned

## Success Criteria
- [ ] New manually created tasks get refs immediately
- [ ] No page refresh required to see new refs
- [ ] System handles multiple concurrent file creations
- [ ] UI updates automatically when refs are assigned
- [ ] Ref assignment is reliable and thread-safe 