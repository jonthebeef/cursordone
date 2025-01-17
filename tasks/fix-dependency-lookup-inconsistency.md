---
title: "Fix dependency lookup inconsistency"
status: todo
priority: high
complexity: S
epic: task-management-enhancement
owner: AI
dependencies: []
tags:
  - bug
  - dependencies
  - enhancement
created: "2025-01-17"
---

There is an inconsistency in how task dependencies are being handled between different components. The task edit dialog is checking dependencies using task refs while the rest of the system uses filenames.

## Requirements

### Code Changes

- [ ] Update `task-edit-dialog.tsx` to use filenames for dependency lookup
- [ ] Ensure consistent dependency handling across all components
- [ ] Update dependency display in task view dialog
- [ ] Add proper error handling for missing dependencies

### Testing

- [ ] Verify dependencies work in task creation
- [ ] Verify dependencies work in task editing
- [ ] Verify dependencies display correctly in task view
- [ ] Test with missing dependencies
- [ ] Test with circular dependencies

## Success Criteria

- Dependencies are consistently handled using filenames across all components
- Task edit dialog correctly shows and saves dependencies
- Task view dialog correctly displays dependencies
- Error states are properly handled
- No regressions in existing dependency functionality
